# diagnose_exec2.py
import os, django, time
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from judge.executors.cpp_executor import prepare_submission, write_input
from judge.executors.warm_runner import start_submission_container, stop_submission_container, compile_cpp_warm

code = '''
#include <iostream>
int main() {
    int a, b;
    std::cin >> a >> b;
    std::cout << (a + b) << std::endl;
    return 0;
}
'''

temp_dir = prepare_submission(code)
write_input(temp_dir, "2 3\n")
container = start_submission_container(temp_dir)
compile_cpp_warm(container)

t0 = time.perf_counter()
exit_code, output = container.exec_run(cmd=["bash", "-c", "pkill -9 -u nobody 2>/dev/null || true"], workdir="/workspace")
print(f"pkill cleanup: {(time.perf_counter()-t0)*1000:.1f}ms, exit={exit_code}, output={output!r}")

t0 = time.perf_counter()
stats = container.stats(stream=False)
print(f"container.stats(): {(time.perf_counter()-t0)*1000:.1f}ms")

stop_submission_container(container)
import shutil; shutil.rmtree(temp_dir, ignore_errors=True)