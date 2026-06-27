# judge/executors/runner.py

import docker
import time
from judge.exceptions import (
    RuntimeErrorJudge,
    TimeLimitExceeded
)

client = docker.from_env()


def run_binary(temp_dir):

    container = client.containers.run(
        image="codejudge-cpp",

        command=[
            "bash",
            "-c",
            "./main < input.txt"
        ],

        volumes={
            temp_dir: {
                "bind": "/workspace",
                "mode": "rw"
            }
        },

        working_dir="/workspace",

        network_disabled=True,

        mem_limit="128m",

        pids_limit=64,
        user="nobody",
        security_opt=[
            "no-new-privileges"
        ],

        cap_drop=["ALL"],

        detach=True
    )

    start = time.time()

    try:
        result = container.wait(timeout=2)
    except Exception:
        try:
            container.kill()
            container.remove(force=True)
        except Exception:
            pass
        raise TimeLimitExceeded("Execution exceeded 2 seconds")

    runtime = time.time() - start
    logs = container.logs().decode()
    status = result["StatusCode"]

    # --- SAFE STATS EXTRACTION ---
    memory_used = 0
    try:
        stats = container.stats(stream=False)
        # Use safe .get() navigation because exited containers miss keys
        memory_stats = stats.get("memory_stats", {})
        memory_used = memory_stats.get("usage", 0)
    except Exception:
        pass  # Fallback to 0 if the container is already destroyed or inaccessible

    try:
        container.remove(force=True)
    except Exception:
        pass

    if status != 0:
        raise RuntimeErrorJudge(logs)

    return {
        "output": logs,
        "runtime": runtime,
        "memory": memory_used
    }