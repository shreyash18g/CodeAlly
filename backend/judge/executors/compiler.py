# judge/executors/compiler.py

import docker
from judge.exceptions import CompileError

client = docker.from_env()


def compile_cpp(temp_dir):

    container = client.containers.run(
        image="codejudge-cpp",

        command=[
            "bash",
            "-c",
            "g++ main.cpp -o main"
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

    result = container.wait()

    logs = container.logs().decode()

    container.remove(force=True)

    if result["StatusCode"] != 0:
        raise CompileError(logs)