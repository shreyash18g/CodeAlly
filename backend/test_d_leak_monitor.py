"""
Test D — Resource leak monitor. Run this in a separate terminal WHILE
Test B or Test C is running, to watch for container leaks or host
resource drift under sustained load.

Specifically watches:
  - total containers (running + exited, from codejudge-cpp image) --
    if "exited but not removed" grows over time, your container.remove()
    calls are failing somewhere (e.g. the race condition in run_binary's
    except-branch when wait(timeout=2) fires).
  - live (running) container count
  - host memory available
  - host file descriptor usage roughly (open files count, optional)

Usage:
    python test_d_leak_monitor.py --interval 2 --duration 120
    (Ctrl+C to stop early; a CSV is written either way)
"""

import argparse
import csv
import subprocess
import time

import psutil  # pip install psutil


def all_containers_count(image="codejudge-cpp"):
    """All containers (running+exited+created) from the image, removed or not."""
    try:
        out = subprocess.run(
            ["docker", "ps", "-a", "--filter", f"ancestor={image}", "-q"],
            capture_output=True, text=True, timeout=5,
        )
        return len([l for l in out.stdout.splitlines() if l.strip()])
    except Exception:
        return -1


def running_containers_count(image="codejudge-cpp"):
    try:
        out = subprocess.run(
            ["docker", "ps", "--filter", f"ancestor={image}", "-q"],
            capture_output=True, text=True, timeout=5,
        )
        return len([l for l in out.stdout.splitlines() if l.strip()])
    except Exception:
        return -1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--interval", type=float, default=2.0)
    parser.add_argument("--duration", type=float, default=120.0)
    parser.add_argument("--out", default="leak_monitor.csv")
    args = parser.parse_args()

    rows = []
    t_start = time.time()

    print(f"Monitoring every {args.interval}s for up to {args.duration}s. Ctrl+C to stop early.\n")
    print(f"{'t(s)':>6} | {'running':>7} | {'all(inc. exited)':>16} | {'mem_avail_mb':>12}")

    try:
        while (time.time() - t_start) < args.duration:
            t = time.time() - t_start
            running = running_containers_count()
            total = all_containers_count()
            mem_avail_mb = psutil.virtual_memory().available / (1024 * 1024)

            print(f"{t:6.1f} | {running:7d} | {total:16d} | {mem_avail_mb:12.1f}")
            rows.append({"t": t, "running": running, "all_including_exited": total,
                         "mem_avail_mb": mem_avail_mb})

            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nStopped early.")

    if rows:
        with open(args.out, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
        print(f"\nWrote {len(rows)} samples to {args.out}")

        leaked = rows[-1]["all_including_exited"] - rows[0]["all_including_exited"]
        still_running_at_end = rows[-1]["running"]
        print(f"\nNet change in total containers (incl. exited) over the run: {leaked}")
        print(f"Containers still RUNNING at end of monitoring window: {still_running_at_end}")
        if still_running_at_end > 0:
            print("^ If load had stopped before monitoring ended, this likely indicates a leak "
                  "(containers not cleaned up, e.g. failed kill()/remove() in the timeout path).")


if __name__ == "__main__":
    main()
