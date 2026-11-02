"""
Test E — Escalating spike test, combining submit_code (judged, async via
Celery) and run_code (synchronous, unauthenticated) bursts simultaneously,
mimicking real concurrent "Submit" + "Run" button mashing during a contest
spike.

Runs through escalating load LEVELS (e.g. 50, 100, 200, 400, 800). At each
level:
  1. Logs in fresh (tokens expire every ~5 min; a long spike run can't rely
     on one token surviving the whole thing)
  2. Fires `submit_burst` submit_code calls AND `run_burst` run_code calls
     CONCURRENTLY (same wall-clock window, not sequential)
  3. Polls DB + Celery + Docker until all submit_code submissions resolve
  4. Records success/failure counts and timing for BOTH paths separately
  5. Writes everything to a CSV row before moving to the next level

The script keeps going through all levels regardless of failures at a
given level (so you get the FULL curve, not just "where it died") --
useful for seeing if a level recovers after a rough one, or degrades
permanently.

"""

import argparse
import asyncio
import csv
import os
import subprocess
import sys
import time

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

RUN_PAYLOAD = {"code": TRIVIAL_CPP, "input": "2 3\n"}


# ---------- infra probes (same approach as Test C) ----------

def docker_container_count(image="codejudge-cpp"):
    try:
        out = subprocess.run(
            ["docker", "ps", "--filter", f"ancestor={image}", "-q"],
            capture_output=True, text=True, timeout=5,
        )
        return len([l for l in out.stdout.splitlines() if l.strip()])
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
    global _celery_app
    if _celery_app is None:
        from celery import Celery
        _celery_app = Celery("inspect_probe")
        _celery_app.conf.broker_url = "redis://localhost:6379/0"
        _celery_app.conf.result_backend = "redis://localhost:6379/0"
    return _celery_app


def celery_active_and_reserved():
    try:
        app = _get_celery_app()
        insp = app.control.inspect(timeout=0.5)
        active = insp.active() or {}
        reserved = insp.reserved() or {}
        return (sum(len(v) for v in active.values()),
                sum(len(v) for v in reserved.values()))
    except Exception:
        return -1, -1


# ---------- auth ----------

def fresh_token(login_url, username, password):
    resp = httpx.post(login_url, json={"email": username, "password": password}, timeout=15.0)
    resp.raise_for_status()
    data = resp.json()
    token = data.get("access") or data.get("access_token") or data.get("token")
    if not token:
        raise RuntimeError(f"Login succeeded but no recognizable token field in response: {data}")
    return token


# ---------- the two burst types ----------

async def fire_submit(client, url, headers, problem_number):
    payload = {"problemNumber": problem_number, "language": "cpp", "code": TRIVIAL_CPP}
    t0 = time.perf_counter()
    try:
        resp = await client.post(url, json=payload, headers=headers, timeout=15.0)
        latency = time.perf_counter() - t0
        if resp.status_code == 202:
            return True, latency, resp.json().get("submissionId")
        return False, latency, None
    except Exception:
        return False, time.perf_counter() - t0, None


async def fire_run(client, url, status_url_template, headers, poll_interval=0.3, poll_timeout=90.0):
    """run_code is now async (returns a taskId immediately, frontend
    polls run-status/<task_id>/ for the result) -- this mirrors that
    flow instead of expecting one blocking response like the old
    synchronous run_code did.

    Returns (success, total_latency) where total_latency now covers
    the full fire+poll-until-resolved time, comparable to the OLD
    measurement's single round-trip latency, but reflecting the new
    two-step reality.
    """
    t0 = time.perf_counter()
    try:
        resp = await client.post(url, json=RUN_PAYLOAD, headers=headers, timeout=15.0)
        if resp.status_code != 202:
            return False, time.perf_counter() - t0
        task_id = resp.json().get("taskId")
        if not task_id:
            return False, time.perf_counter() - t0
    except Exception:
        return False, time.perf_counter() - t0

    status_url = status_url_template.format(task_id=task_id)
    poll_deadline = time.perf_counter() + poll_timeout

    while time.perf_counter() < poll_deadline:
        try:
            # status poll doesn't strictly need auth (see get_run_status's
            # AllowAny + opaque-UUID reasoning) but sending it anyway is
            # harmless and matches what a real frontend would do.
            resp = await client.get(status_url, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "SUCCESS":
                    return True, time.perf_counter() - t0
                if data.get("status") == "FAILURE":
                    return False, time.perf_counter() - t0
                # PENDING / STARTED -- keep polling
        except Exception:
            pass
        await asyncio.sleep(poll_interval)

    return False, time.perf_counter() - t0  # timed out waiting for resolution


async def fire_level(submit_url, run_url, run_status_url_template, headers, problem_number,
                      submit_count, run_count):
    async with httpx.AsyncClient() as client:
        t0 = time.perf_counter()
        submit_tasks = [fire_submit(client, submit_url, headers, problem_number)
                         for _ in range(submit_count)]
        run_tasks = [fire_run(client, run_url, run_status_url_template, headers)
                     for _ in range(run_count)]
        results = await asyncio.gather(*submit_tasks, *run_tasks)
        fire_wall_time = time.perf_counter() - t0

    submit_results = results[:submit_count]
    run_results = results[submit_count:]

    submit_ok = [r for r in submit_results if r[0]]
    submit_ids = [r[2] for r in submit_ok if r[2] is not None]
    run_ok = [r for r in run_results if r[0]]

    return {
        "fire_wall_time": fire_wall_time,
        "submit_fired": submit_count,
        "submit_succeeded": len(submit_ok),
        "submit_ids": submit_ids,
        "run_fired": run_count,
        "run_succeeded": len(run_ok),
        "run_latencies": [r[1] for r in run_results],
    }


def poll_until_resolved(submission_ids, poll_interval=0.5, timeout=180):
    pending = set(submission_ids)
    t_start = time.perf_counter()
    peak_redis_q = 0
    peak_active = 0
    peak_reserved = 0
    peak_containers = 0

    while pending and (time.perf_counter() - t_start) < timeout:
        qd = redis_queue_depth()
        active, reserved = celery_active_and_reserved()
        cc = docker_container_count()
        peak_redis_q = max(peak_redis_q, qd if qd >= 0 else 0)
        peak_active = max(peak_active, active if active >= 0 else 0)
        peak_reserved = max(peak_reserved, reserved if reserved >= 0 else 0)
        peak_containers = max(peak_containers, cc if cc >= 0 else 0)

        resolved_now = []
        for sid in list(pending):
            try:
                sub = Submission.objects.get(id=sid)
            except Submission.DoesNotExist:
                continue
            if sub.verdict not in ("QUEUED", "RUNNING"):
                resolved_now.append(sid)
        for sid in resolved_now:
            pending.discard(sid)

        if pending:
            time.sleep(poll_interval)

    drain_time = time.perf_counter() - t_start
    timed_out = len(pending)
    return drain_time, timed_out, peak_redis_q, peak_active, peak_reserved, peak_containers


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--submit-url", required=True)
    parser.add_argument("--run-url", required=True)
    parser.add_argument("--run-status-url-template", required=True,
                         help="URL template with {task_id} placeholder, e.g. "
                              "http://localhost:8000/api/judge/run-status/{task_id}/")
    parser.add_argument("--login-url", required=True)
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--levels", default="50,100,200,400,800")
    parser.add_argument("--run-burst-ratio", type=float, default=1.0,
                         help="run_code calls fired per submit_code call at each level")
    parser.add_argument("--problem-number", type=int, default=1)
    parser.add_argument("--poll-interval", type=float, default=0.5)
    parser.add_argument("--drain-timeout", type=float, default=180)
    parser.add_argument("--cooldown-between-levels", type=float, default=5.0)
    parser.add_argument("--out", default="spike_results.csv")
    args = parser.parse_args()

    levels = [int(x) for x in args.levels.split(",")]
    rows = []

    csv_header = ["level", "submit_fired", "submit_succeeded", "submit_failed",
                  "run_fired", "run_succeeded", "run_failed", "fire_wall_time_s",
                  "drain_time_s", "submissions_timed_out", "peak_redis_queue",
                  "peak_celery_active", "peak_celery_reserved",
                  "peak_docker_containers", "total_level_time_s", "error"]
    csv_file = open(args.out, "w", newline="")
    csv_writer = csv.DictWriter(csv_file, fieldnames=csv_header)
    csv_writer.writeheader()
    csv_file.flush()

    print(f"Spike test levels: {levels}")
    print(f"run_code:submit_code ratio: {args.run_burst_ratio}:1")
    print(f"Writing incrementally to {args.out} as each level completes "
          f"(safe to Ctrl+C between levels without losing data)\n")

    for level in levels:
        submit_count = level
        run_count = int(level * args.run_burst_ratio)

        print(f"\n{'='*70}")
        print(f"LEVEL: {level}  (submit_code x{submit_count}, run_code x{run_count})")
        print(f"{'='*70}")

        try:
            token = fresh_token(args.login_url, args.username, args.password)
        except Exception as e:
            print(f"  LOGIN FAILED: {e!r} -- aborting this level")
            row = {"level": level, "error": f"login_failed: {e!r}"}
            rows.append(row)
            csv_writer.writerow(row)
            csv_file.flush()
            continue

        headers = {"Authorization": f"Bearer {token}"}

        t_level_start = time.perf_counter()
        fire_result = asyncio.run(
            fire_level(args.submit_url, args.run_url, args.run_status_url_template,
                       headers, args.problem_number, submit_count, run_count)
        )

        print(f"  Fired in {fire_result['fire_wall_time']:.2f}s")
        print(f"  submit_code: {fire_result['submit_succeeded']}/{fire_result['submit_fired']} accepted")
        print(f"  run_code:    {fire_result['run_succeeded']}/{fire_result['run_fired']} succeeded")
        if fire_result['run_latencies']:
            import statistics
            lat = fire_result['run_latencies']
            print(f"  run_code latency: mean={statistics.mean(lat)*1000:.0f}ms "
                  f"max={max(lat)*1000:.0f}ms")

        submit_ids = fire_result["submit_ids"]
        if submit_ids:
            print(f"  Polling {len(submit_ids)} accepted submissions for resolution...")
            (drain_time, timed_out, peak_redis_q,
             peak_active, peak_reserved, peak_containers) = poll_until_resolved(
                submit_ids, args.poll_interval, args.drain_timeout
            )
            print(f"  Drain time: {drain_time:.1f}s  Timed out (never resolved): {timed_out}")
            print(f"  Peak redis_queue={peak_redis_q}  peak_active={peak_active}  "
                  f"peak_reserved={peak_reserved}  peak_containers={peak_containers}")
        else:
            drain_time = 0
            timed_out = 0
            peak_redis_q = peak_active = peak_reserved = peak_containers = 0
            print("  No submissions were accepted at this level -- skipping drain poll.")

        row = {
            "level": level,
            "submit_fired": fire_result["submit_fired"],
            "submit_succeeded": fire_result["submit_succeeded"],
            "submit_failed": fire_result["submit_fired"] - fire_result["submit_succeeded"],
            "run_fired": fire_result["run_fired"],
            "run_succeeded": fire_result["run_succeeded"],
            "run_failed": fire_result["run_fired"] - fire_result["run_succeeded"],
            "fire_wall_time_s": round(fire_result["fire_wall_time"], 2),
            "drain_time_s": round(drain_time, 2),
            "submissions_timed_out": timed_out,
            "peak_redis_queue": peak_redis_q,
            "peak_celery_active": peak_active,
            "peak_celery_reserved": peak_reserved,
            "peak_docker_containers": peak_containers,
            "total_level_time_s": round(time.perf_counter() - t_level_start, 2),
        }
        rows.append(row)
        csv_writer.writerow(row)
        csv_file.flush()

        submit_fail_rate = row["submit_failed"] / row["submit_fired"] if row["submit_fired"] else 0
        run_fail_rate = row["run_failed"] / row["run_fired"] if row["run_fired"] else 0
        if submit_fail_rate > 0.05 or run_fail_rate > 0.05 or timed_out > 0:
            print(f"\n  *** Failure rate exceeded 5% (or timeouts occurred) at level {level}. ***")
            print(f"  *** Continuing to next level anyway to map the full curve. ***")

        if level != levels[-1]:
            print(f"  Cooling down {args.cooldown_between_levels}s before next level...")
            time.sleep(args.cooldown_between_levels)

    print(f"\n\n{'='*70}")
    print("SPIKE TEST SUMMARY")
    print(f"{'='*70}")
    header = ["level", "submit_succeeded", "submit_failed", "run_succeeded",
              "run_failed", "drain_time_s", "submissions_timed_out",
              "peak_celery_active", "peak_celery_reserved", "peak_docker_containers"]
    print(" | ".join(f"{h:>14}" for h in header))
    for row in rows:
        if "error" in row:
            print(f"level {row['level']}: {row['error']}")
            continue
        print(" | ".join(f"{str(row.get(h, '')):>14}" for h in header))

    csv_file.close()
    print(f"\nFull results written to {args.out}")


if __name__ == "__main__":
    main()
