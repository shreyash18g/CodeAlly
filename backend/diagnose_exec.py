# diagnose_exec.py — run with: python3 diagnose_exec.py
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

# Test 1: plain exec, no timeout wrapper, see how long THIS takes alone
t0 = time.perf_counter()
exit_code, output = container.exec_run(cmd=["bash", "-c", "./main < input.txt"], workdir="/workspace")
print(f"WITHOUT timeout wrapper: {(time.perf_counter()-t0)*1000:.1f}ms, exit={exit_code}, output={output!r}")

# Test 2: with the timeout wrapper, exactly as warm_runner does it
t0 = time.perf_counter()
exit_code, output = container.exec_run(cmd=["bash", "-c", "timeout 2 ./main < input.txt"], workdir="/workspace")
print(f"WITH timeout wrapper:    {(time.perf_counter()-t0)*1000:.1f}ms, exit={exit_code}, output={output!r}")

stop_submission_container(container)
import shutil; shutil.rmtree(temp_dir, ignore_errors=True)