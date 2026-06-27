# judge/docker_runner.py
import docker

# Initialize the Docker engine client connection
client = docker.from_env()