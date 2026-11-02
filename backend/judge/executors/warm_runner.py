"""
judge/executors/warm_runner.py

Warm-container execution model: ONE Docker container is created per
submission (not per test case). Compilation and every test case run
via `container.exec_run(...)` inside that single already-running
container, instead of `client.containers.run(...)` spawning a fresh
container each time.

This eliminates per-test-case container spawn/teardown overhead (image
mount, namespace creation, cgroup setup) which Test A measured at
~150-450ms per spawn on this machine. Compilation and each test case
now only pay the cost of spawning a new PROCESS inside an existing
container, not a new CONTAINER.

Tradeoff vs. the original per-test-case-container design: test cases
within the same submission now share one container's resource limits
(mem_limit, pids_limit) rather than each getting a fresh slate. A
test case that leaves zombie processes or leaked memory could in
principle affect a later test case in the same submission. We mitigate
this by:
  - using `timeout` inside the exec command so runaway processes are
    killed by the kernel, not just abandoned
  - running `pkill -9 -u nobody` as a best-effort cleanup after each
    exec, to reap anything `timeout` didn't catch
  - taking a fresh stats() snapshot after each exec for memory reporting,
    same as the original design

This is NOT perfect isolation -- it's the same tradeoff real competitive
judges make in exchange for speed. Document this explicitly if asked
about it in an interview; it's a deliberate, explainable design choice,
not an oversight.
"""

import time
import docker

from judge.exceptions import (
    CompileError,
    RuntimeErrorJudge,
    TimeLimitExceeded,
)

client = docker.from_env()

TIME_LIMIT_SECONDS = 2
IMAGE = "codejudge-cpp"


def start_submission_container(temp_dir):
    """Starts ONE long-lived container for the whole submission.
    Caller is responsible for calling stop_submission_container() in a
    finally block."""
    container = client.containers.run(
        image=IMAGE,
        # Keep the container alive indefinitely; we exec into it for
        # every actual piece of work (compile, then each test case run).
        command=["tail", "-f", "/dev/null"],
        volumes={
            temp_dir: {
                "bind": "/workspace",
                "mode": "rw",
            }
        },
        working_dir="/workspace",
        network_disabled=True,
        mem_limit="128m",
        pids_limit=64,
        user="nobody",
        security_opt=["no-new-privileges"],
        cap_drop=["ALL"],
        detach=True,
    )
    return container


def stop_submission_container(container):
    """Always call this when done with a submission's container,
    whether it succeeded or errored out."""
    try:
        container.kill()
    except Exception:
        pass
    try:
        container.remove(force=True)
    except Exception:
        pass


def _best_effort_cleanup(container):
    """Reap any stray processes left behind by a timed-out exec, so
    they don't bleed into the next test case's resource usage. This is
    a mitigation, not a guarantee -- see module docstring."""
    try:
        container.exec_run(
            cmd=["bash", "-c", "pkill -9 -u nobody 2>/dev/null || true"],
            workdir="/workspace",
        )
    except Exception:
        pass


def compile_cpp_warm(container):
    """Compiles main.cpp inside the already-running container.
    Raises CompileError on non-zero exit."""
    exit_code, output = container.exec_run(
        cmd=["bash", "-c", "g++ main.cpp -o main"],
        workdir="/workspace",
    )
    logs = output.decode() if isinstance(output, bytes) else str(output)

    if exit_code != 0:
        raise CompileError(logs)


def run_binary_warm(container):
    """Runs ./main < input.txt inside the already-running container,
    using the `timeout` utility for the time limit instead of a
    client-side wait(timeout=...), since exec_run has no native timeout
    parameter. Returns the same shape as the original run_binary():
    {"output", "runtime", "memory"}.
    """
    start = time.perf_counter()

    # `timeout 2` sends SIGTERM after 2s and the shell reports exit
    # code 124 if that happened -- this is how we detect TLE without
    # client-side timeout plumbing.
    exit_code, output = container.exec_run(
        cmd=["bash", "-c", f"timeout {TIME_LIMIT_SECONDS} ./main < input.txt"],
        workdir="/workspace",
    )

    runtime = time.perf_counter() - start
    logs = output.decode() if isinstance(output, bytes) else str(output)

    # Best-effort: reap anything timeout's SIGTERM didn't fully clean up
    # before we read memory usage or move to the next test case.
    _best_effort_cleanup(container)

    # NOTE: container.stats(stream=False) was measured to cost ~1000ms
    # per call (Docker Engine API samples a CPU-usage delta window even
    # in "non-streaming" mode). Calling it once per test case -- as the
    # original per-test-case-container design implicitly did once per
    # container's entire lifetime -- destroys the whole point of the
    # warm-container model when called this often. Instead we read the
    # cgroup v2 memory.peak file directly: a plain file read, no
    # sampling delay, confirmed ~tens of ms via exec_run.
    #
    # memory.peak is a high-water mark for the cgroup's whole lifetime,
    # not per-exec -- it naturally matches the existing
    # max(max_memory, result["memory"]) accumulation pattern in
    # judge_problem_warm, since the running max across test cases is
    # exactly what we want to report. We lose the ability to attribute
    # the peak to a SPECIFIC test case, but the original per-container
    # design didn't track that either.
    #
    # This assumes cgroup v2 (confirmed via `cat /proc/self/cgroup`
    # showing a single "0::/" line). If this ever runs on a cgroup v1
    # host, this path won't exist and memory_used will silently stay 0
    # -- the try/except below catches that, but if you ever migrate
    # hosts, re-check with the same diagnostic and adjust the path to
    # /sys/fs/cgroup/memory/memory.max_usage_in_bytes for v1.
    memory_used = 0
    try:
        _, mem_output = container.exec_run(
            cmd=["cat", "/sys/fs/cgroup/memory.peak"],
            workdir="/workspace",
        )
        mem_str = mem_output.decode().strip() if isinstance(mem_output, bytes) else str(mem_output).strip()
        memory_used = int(mem_str)
    except Exception:
        pass

    if exit_code == 124:
        raise TimeLimitExceeded(
            f"Execution exceeded {TIME_LIMIT_SECONDS} seconds"
        )

    if exit_code != 0:
        raise RuntimeErrorJudge(logs)

    return {
        "output": logs,
        "runtime": runtime,
        "memory": memory_used,
    }