@echo off
title Smart Energy Dashboard Server
echo ===================================================
echo Starting Smart Household Energy Dashboard + Tunnel...
echo ===================================================
cd /d "%~dp0"
start "Streamlit App" /min py -3.11 -m streamlit run smart_energy/app.py --server.port 8501 --server.headless true
echo Streamlit started on port 8501.
echo Starting Cloudflare Tunnel...
.\cloudflared.exe tunnel --url http://127.0.0.1:8501 --no-autoupdate
pause
