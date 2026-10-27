$ErrorActionPreference = "Stop"

# Stop any previous instances
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Remove old log if exists
if (Test-Path "cloudflared.log") {
    Remove-Item "cloudflared.log" -Force
}

# 1. Start Streamlit
Write-Output "Starting Streamlit..."
$streamlit = Start-Process -FilePath "py" -ArgumentList "-3.11", "-m", "streamlit", "run", "smart_energy/app.py", "--server.port", "8501", "--server.headless", "true" -PassThru -WindowStyle Hidden

# Wait for Streamlit to respond on port 8501
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $res = Invoke-WebRequest -Uri "http://127.0.0.1:8501" -UseBasicParsing -TimeoutSec 2
        if ($res.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $ready) {
    Write-Error "Streamlit failed to start on port 8501"
}
Write-Output "Streamlit is running on port 8501."

# 2. Start Cloudflared tunnel
Write-Output "Starting Cloudflare tunnel..."
$tunnel = Start-Process -FilePath "$PSScriptRoot\cloudflared.exe" -ArgumentList "tunnel", "--url", "http://127.0.0.1:8501", "--logfile", "$PSScriptRoot\cloudflared.log", "--no-autoupdate" -PassThru -WindowStyle Hidden

# 3. Read log until URL is found
$url = $null
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path "cloudflared.log") {
        $content = Get-Content "cloudflared.log" -Raw -ErrorAction SilentlyContinue
        if ($content -match "https://[-a-zA-Z0-9]+\.trycloudflare\.com") {
            $url = $matches[0]
            break
        }
    }
}

if ($url) {
    Write-Output "SUCCESS: Live URL is $url"
    Set-Content -Path "LIVE_URL.txt" -Value $url -Force
} else {
    Write-Error "Failed to obtain Cloudflare tunnel URL"
}
