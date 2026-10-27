import subprocess
import time
import re
import sys
import os

print("Starting Streamlit application...")
streamlit_proc = subprocess.Popen(
    [sys.executable, "-m", "streamlit", "run", "smart_energy/app.py", "--server.port", "8501", "--server.headless", "true"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

time.sleep(3)

print("Starting Cloudflare tunnel...")
tunnel_proc = subprocess.Popen(
    ["./cloudflared.exe", "tunnel", "--url", "http://127.0.0.1:8501", "--no-autoupdate"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

public_url = None
start_time = time.time()

while time.time() - start_time < 60:
    line = tunnel_proc.stdout.readline()
    if not line:
        time.sleep(0.1)
        continue
    print("[tunnel]", line.strip())
    match = re.search(r"https://[-a-zA-Z0-9]+\.trycloudflare\.com", line)
    if match:
        public_url = match.group(0)
        break

if public_url:
    print("\n" + "="*50)
    print("LIVE PUBLIC URL:", public_url)
    print("LOCAL URL: http://localhost:8501")
    print("="*50 + "\n")
    with open("LIVE_URL.txt", "w", encoding="utf-8") as f:
        f.write(public_url + "\n")
else:
    print("Could not obtain public URL within 60s.")

# Keep process alive
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    pass
finally:
    tunnel_proc.terminate()
    streamlit_proc.terminate()
