"""
Test A — Container spawn overhead in isolation.

Measures the pure Docker cost of compile_cpp() + run_binary(), with no
Django, no Celery, no HTTP in the loop. This gives you the baseline
"cost per container spawn" number that everything else is built on.

Make sure the codejudge-cpp image is already built and Docker daemon is running.
"""

import os
import sys
import time
import shutil
import statistics

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from judge.executors.cpp_executor import prepare_submission, write_input
from judge.executors.compiler import compile_cpp
from judge.executors.runner import run_binary

# A trivial, fast C++ program — we want to measure CONTAINER overhead,
# not the program's own runtime. Keep this dumb on purpose.
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


def time_compile(temp_dir):
    t0 = time.perf_counter()
    compile_cpp(temp_dir)
    return time.perf_counter() - t0


def time_run(temp_dir):
    t0 = time.perf_counter()
    run_binary(temp_dir)
    return time.perf_counter() - t0


def main():
    compile_times = []
    run_times = []

    print(f"Running {N_RUNS} iterations of compile+run (serial, isolated)...\n")

    for i in range(N_RUNS):
        temp_dir = prepare_submission(TRIVIAL_CPP)
        try:
            ct = time_compile(temp_dir)
            compile_times.append(ct)

            write_input(temp_dir, "2 3\n")
            rt = time_run(temp_dir)
            run_times.append(rt)

            print(f"  [{i+1}/{N_RUNS}] compile={ct*1000:.1f}ms  run={rt*1000:.1f}ms")
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def summarize(name, times):
        print(f"\n--- {name} ---")
        print(f"  n      = {len(times)}")
        print(f"  mean   = {statistics.mean(times)*1000:.1f} ms")
        print(f"  median = {statistics.median(times)*1000:.1f} ms")
        print(f"  stdev  = {statistics.stdev(times)*1000:.1f} ms" if len(times) > 1 else "  stdev  = n/a")
        print(f"  min    = {min(times)*1000:.1f} ms")
        print(f"  max    = {max(times)*1000:.1f} ms")

    summarize("compile_cpp (1 container spawn: g++)", compile_times)
    summarize("run_binary (1 container spawn: execute)", run_times)

    total_per_submission_1tc = statistics.mean(compile_times) + statistics.mean(run_times)
    print(f"\nEstimated cost for a submission with 1 hidden test case: "
          f"{total_per_submission_1tc*1000:.1f} ms")
    for n_tc in (5, 15, 30):
        est = statistics.mean(compile_times) + n_tc * statistics.mean(run_times)
        print(f"Estimated cost for a submission with {n_tc} hidden test cases: "
              f"{est*1000:.1f} ms ({est:.2f}s)")


if __name__ == "__main__":
    main()
