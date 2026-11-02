"""
Test C — Burst submission load through the real submit_code -> Celery path.

Simulates the "everyone submits at contest start" scenario:
  1. Fires N submissions near-instantly via the authenticated submit_code API
  2. Polls Submission.verdict in the DB over time until all resolve
  3. Simultaneously samples Redis queue depth (Celery broker queue) and
     live Docker container count, on a fixed interval, building a timeline

This tells you: how long the queue takes to drain, whether time-to-verdict
scales linearly or worse with burst size, and whether Celery concurrency
is your limiter (compare runs with different `celery -A backend worker
--concurrency=N`).


"""

import argparse
import asyncio
import os
import sys
import time
import subprocess

import httpx

try:
    import redis
except ImportError:
    redis = None

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from submissions.models import Submission  # noqa: E402

TRIVIAL_CPP = r"""
#include <iostream>
int main() {
    int a, b;
    std::cin >> a >> b;
    std::cout << (a + b) << std::endl;
    return 0;
}
"""


def docker_container_count():
    """Live count of running containers from the codejudge-cpp image."""
    try:
        out = subprocess.run(
            ["docker", "ps", "--filter", "ancestor=codejudge-cpp", "-q"],
            capture_output=True, text=True, timeout=5,
        )
        lines = [l for l in out.stdout.splitlines() if l.strip()]
        return len(lines)
    except Exception:
        return -1


def redis_queue_depth(redis_url="redis://localhost:6379/0", queue_name="judge"):
    if redis is None:
        return -1
    try:
        r = redis.from_url(redis_url)
        return r.llen(queue_name)
    except Exception:
        return -1


_celery_app = None


def _get_celery_app():
    """Lazily build a Celery app instance for inspect() calls, reusing
    the same broker config your real backend.celery module uses."""
    global _celery_app
    if _celery_app is None:
        from celery import Celery
        _celery_app = Celery("inspect_probe")
        _celery_app.conf.broker_url = "redis://localhost:6379/0"
        _celery_app.conf.result_backend = "redis://localhost:6379/0"
    return _celery_app


def celery_active_and_reserved():
    """Returns (active_count, reserved_count) across all known workers.

    active = tasks a worker process has actually started executing
    reserved = tasks a worker has PREFETCHED into its local buffer but
               not started yet -- these are invisible to redis_queue_depth()
               because Celery's prefetch mechanism removes them from the
               Redis list as soon as a worker claims them, well before
               the worker actually begins running them.

    Together these give a much more honest picture of "how much work is
    in flight right now" than LLEN on the broker queue alone.
    """
    try:
        app = _get_celery_app()
        insp = app.control.inspect(timeout=0.5)

        active = insp.active() or {}
        reserved = insp.reserved() or {}

        active_count = sum(len(tasks) for tasks in active.values())
        reserved_count = sum(len(tasks) for tasks in reserved.values())
        return active_count, reserved_count
    except Exception:
        return -1, -1


async def fire_submission(client: httpx.AsyncClient, url: str, headers: dict,
                           problem_number: int) -> int | None:
    payload = {
        "problemNumber": problem_number,
        "language": "cpp",
        "code": TRIVIAL_CPP,
    }
    try:
        resp = await client.post(url, json=payload, headers=headers, timeout=10.0)
        if resp.status_code == 202:
            return resp.json().get("submissionId")
        print(f"  unexpected status {resp.status_code}: {resp.text[:200]}")
        return None
    except Exception as e:
        print(f"  submit error: {e!r}")
        return None


async def fire_burst(url: str, headers: dict, burst_size: int, problem_number: int):
    async with httpx.AsyncClient() as client:
        t0 = time.perf_counter()
        ids = await asyncio.gather(*[
            fire_submission(client, url, headers, problem_number)
            for _ in range(burst_size)
        ])
        elapsed = time.perf_counter() - t0
    ids = [i for i in ids if i is not None]
    print(f"Fired {len(ids)}/{burst_size} submissions in {elapsed:.2f}s "
          f"(enqueue throughput: {len(ids)/elapsed:.1f} submissions/s)\n")
    return ids


def poll_until_resolved(submission_ids, poll_interval=1.0, timeout=300):
    """Polls DB directly (fast, no HTTP) for verdict resolution.
    Also samples Redis queue depth, Celery active/reserved task counts,
    and Docker container count each tick."""
    pending = set(submission_ids)
    resolved_at = {}
    t_start = time.perf_counter()
    timeline = []

    while pending and (time.perf_counter() - t_start) < timeout:
        now = time.perf_counter() - t_start
        qdepth = redis_queue_depth()
        active, reserved = celery_active_and_reserved()
        ccount = docker_container_count()
        timeline.append((now, len(pending), qdepth, active, reserved, ccount))
        print(f"  t={now:5.1f}s  pending={len(pending):3d}  "
              f"redis_queue={qdepth:3d}  celery_active={active:3d}  "
              f"celery_reserved={reserved:3d}  live_containers={ccount:3d}")

        resolved_now = []
        for sid in list(pending):
            try:
                sub = Submission.objects.get(id=sid)
            except Submission.DoesNotExist:
                continue
            if sub.verdict not in ("QUEUED", "RUNNING"):
                resolved_now.append(sid)
                resolved_at[sid] = now

        for sid in resolved_now:
            pending.discard(sid)

        if pending:
            time.sleep(poll_interval)

    return resolved_at, timeline, pending  # pending = anything that timed out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--token", required=True, help="Auth token (we send as Bearer)")
    parser.add_argument("--burst-size", type=int, default=20)
    parser.add_argument("--problem-number", type=int, default=1)
    parser.add_argument("--poll-interval", type=float, default=1.0)
    parser.add_argument("--timeout", type=float, default=300)
    args = parser.parse_args()

    headers = {"Authorization": f"Bearer {args.token}"}

    print(f"Burst size: {args.burst_size}  Target: {args.url}\n")
    ids = asyncio.run(fire_burst(args.url, headers, args.burst_size, args.problem_number))

    if not ids:
        print("No submissions succeeded, aborting.")
        sys.exit(1)

    print("Polling for resolution (DB + Redis + docker ps each tick)...\n")
    resolved_at, timeline, timed_out = poll_until_resolved(
        ids, poll_interval=args.poll_interval, timeout=args.timeout
    )

    print("\n=== Results ===")
    if resolved_at:
        times = sorted(resolved_at.values())
        print(f"Resolved: {len(times)}/{len(ids)}")
        print(f"First verdict at: {times[0]:.1f}s")
        print(f"Last verdict at:  {times[-1]:.1f}s  <- total drain time for the burst")
        print(f"Median time-to-verdict: {times[len(times)//2]:.1f}s")
    if timed_out:
        print(f"TIMED OUT (never resolved): {len(timed_out)} submissions -> ids: {sorted(timed_out)}")

    print(f"\nPeak Redis queue depth observed (raw LLEN): {max((t[2] for t in timeline), default=-1)}")
    print(f"Peak Celery ACTIVE tasks observed: {max((t[3] for t in timeline), default=-1)}")
    print(f"Peak Celery RESERVED (prefetched) tasks observed: {max((t[4] for t in timeline), default=-1)}")
    print(f"Peak live container count observed: {max((t[5] for t in timeline), default=-1)}")
    print(f"\nNote: Celery's prefetch mechanism removes tasks from the Redis list as soon as a "
          f"worker claims them, so raw LLEN under-reports real backlog. 'reserved' shows tasks "
          f"claimed but not yet started; 'active' shows tasks actually executing right now.")


if __name__ == "__main__":
    main()
