#!/usr/bin/env python3
import argparse
import os
import pty
import signal
import sys
import threading


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cwd", required=True)
    ap.add_argument("--", dest="dashdash", action="store_true")
    ap.add_argument("cmd", nargs=argparse.REMAINDER)
    args = ap.parse_args()

    if not args.cmd:
        print("missing command", file=sys.stderr)
        return 2

    cmd = args.cmd
    # Strip a leading "--" that argparse may include depending on invocation.
    if cmd and cmd[0] == "--":
        cmd = cmd[1:]
    if not cmd:
        print("missing command", file=sys.stderr)
        return 2

    # Create a new pseudo-terminal for the child.
    pid, master_fd = pty.fork()
    if pid == 0:
        # Child
        try:
            os.chdir(args.cwd)
        except Exception as e:
            print(f"chdir failed: {e}", file=sys.stderr)
            os._exit(127)
        try:
            os.execvp(cmd[0], cmd)
        except Exception as e:
            print(f"exec failed: {e}", file=sys.stderr)
            os._exit(127)

    # Parent: bridge stdin/stdout <-> master_fd (threaded; avoids platform select() quirks)
    stdin_fd = sys.stdin.fileno()
    stdout_fd = sys.stdout.fileno()
    stop = threading.Event()

    def _pump(src_fd: int, dst_fd: int):
        while not stop.is_set():
            try:
                data = os.read(src_fd, 4096)
            except OSError:
                break
            if not data:
                break
            try:
                os.write(dst_fd, data)
            except OSError:
                break

    t_out = threading.Thread(target=_pump, args=(master_fd, stdout_fd), daemon=True)
    t_in = threading.Thread(target=_pump, args=(stdin_fd, master_fd), daemon=True)
    t_out.start()
    t_in.start()

    # Ensure we can Ctrl+C the whole tree.
    def _sigint(_signum, _frame):
        try:
            os.kill(pid, signal.SIGINT)
        except Exception:
            pass

    signal.signal(signal.SIGINT, _sigint)

    try:
        while True:
            # Check child exit
            try:
                wpid, status = os.waitpid(pid, os.WNOHANG)
            except ChildProcessError:
                break
            if wpid == pid:
                stop.set()
                if os.WIFEXITED(status):
                    return os.WEXITSTATUS(status)
                if os.WIFSIGNALED(status):
                    return 128 + os.WTERMSIG(status)
                return 1
            # Avoid busy loop.
            stop.wait(0.05)
    finally:
        stop.set()
        try:
            os.close(master_fd)
        except Exception:
            pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
