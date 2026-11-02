"""
Test A-warm — same measurement as test_a_container_overhead.py, but
against the new warm-container execution path (judge_problem_warm /
warm_runner.py) instead of the original per-test-case-container path.

Run this AFTER test_a_container_overhead.py so you have both numbers
to compare directly. Same trivial C++ program, same iteration count,
same machine -- only the execution model differs.

"""

import os
import sys
import shutil
import statistics
import time

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from judge.executors.cpp_executor import prepare_submission, write_input
from judge.executors.warm_runner import (
    start_submission_container,
    stop_submission_container,
    compile_cpp_warm,
    run_binary_warm,
)

TRIVIAL_CPP = r"""
#include <iostream>
int main() {
    int a, b;
    std::cin >> a >> b;
    std::cout << (a + b) << std::endl;
    return 0;
}
"""

N_RUNS = int(sys.argv[1]) if len(sys.argv) > 1 else 30
N_TESTCASES = int(sys.argv[2]) if len(sys.argv) > 2 else 1


def run_one_submission(n_testcases):
    """Returns (container_start_time, compile_time, [run_times], teardown_time)."""
    temp_dir = prepare_submission(TRIVIAL_CPP)
    container = None
    try:
        t0 = time.perf_counter()
        container = start_submission_container(temp_dir)
        container_start_time = time.perf_counter() - t0

        t0 = time.perf_counter()
        compile_cpp_warm(container)
        compile_time = time.perf_counter() - t0

        run_times = []
        for _ in range(n_testcases):
            write_input(temp_dir, "2 3\n")
            t0 = time.perf_counter()
            run_binary_warm(container)
            run_times.append(time.perf_counter() - t0)

        return container_start_time, compile_time, run_times
    finally:
        if container is not None:
            t0 = time.perf_counter()
            stop_submission_container(container)
            teardown_time = time.perf_counter() - t0
        else:
            teardown_time = 0
        shutil.rmtree(temp_dir, ignore_errors=True)
        # stash teardown on the outer scope via return below
        run_one_submission.last_teardown = teardown_time


def summarize(name, times):
    print(f"\n--- {name} ---")
    print(f"  n      = {len(times)}")
    print(f"  mean   = {statistics.mean(times)*1000:.1f} ms")
    print(f"  median = {statistics.median(times)*1000:.1f} ms")
    print(f"  stdev  = {statistics.stdev(times)*1000:.1f} ms" if len(times) > 1 else "  stdev  = n/a")
    print(f"  min    = {min(times)*1000:.1f} ms")
    print(f"  max    = {max(times)*1000:.1f} ms")


def main():
    starts, compiles, teardowns = [], [], []
    all_run_times = []
    full_submission_totals = []

    print(f"Running {N_RUNS} full submissions, {N_TESTCASES} test case(s) each, "
          f"warm-container model...\n")

    for i in range(N_RUNS):
        t_total0 = time.perf_counter()
        start_t, compile_t, run_times = run_one_submission(N_TESTCASES)
        teardown_t = run_one_submission.last_teardown
        total_t = time.perf_counter() - t_total0

        starts.append(start_t)
        compiles.append(compile_t)
        teardowns.append(teardown_t)
        all_run_times.extend(run_times)
        full_submission_totals.append(total_t)

        print(f"  [{i+1}/{N_RUNS}] container_start={start_t*1000:.1f}ms  "
              f"compile={compile_t*1000:.1f}ms  "
              f"avg_exec={statistics.mean(run_times)*1000:.1f}ms  "
              f"teardown={teardown_t*1000:.1f}ms  "
              f"TOTAL={total_t*1000:.1f}ms")

    summarize("container start (1 per submission, NOT per test case)", starts)
    summarize("compile_cpp_warm (exec_run inside existing container)", compiles)
    summarize("run_binary_warm (exec_run per test case)", all_run_times)
    summarize("container teardown", teardowns)
    summarize(f"FULL SUBMISSION TOTAL ({N_TESTCASES} test case(s))", full_submission_totals)

    print(f"\n--- Extrapolation to other test case counts (using measured per-exec cost) ---")
    base_overhead = statistics.mean(starts) + statistics.mean(compiles) + statistics.mean(teardowns)
    per_exec = statistics.mean(all_run_times)
    for n_tc in (5, 15, 30):
        est = base_overhead + n_tc * per_exec
        print(f"  {n_tc} test cases: {est*1000:.1f} ms ({est:.2f}s)  "
              f"[container overhead paid ONCE: {base_overhead*1000:.1f}ms]")


if __name__ == "__main__":
    main()
