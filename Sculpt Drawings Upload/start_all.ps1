# ============================================================
# SCULPT JOB TRACKER - Unified Startup Script
# ============================================================
# Run this ONE script to launch everything:
#   1. Python DXF Scanner (background, port 8000)
#   2. Job Tracker dev server (foreground, port 5000)
#
# Then just work in the Job Tracker at http://localhost:5000
# ============================================================
$env:PYTHONIOENCODING = "utf-8"

$DXF_SCANNER_DIR = "c:\Users\rudyb\Sculpt Drawings Upload"
$JOB_TRACKER_DIR = "c:\Users\rudyb\Sculpt Job Tracker\temp_app"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SCULPT JOB TRACKER - Starting Services" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- Step 1: Start DXF Scanner in background ---
Write-Host "[1/2] Starting DXF Scanner (port 8000)..." -ForegroundColor Yellow

# Kill any existing process on port 8000
$existing = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($existing) {
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "  Killed existing process on port 8000" -ForegroundColor DarkGray
}

# Kill any existing process on port 5000
$existing5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($existing5000) {
    Stop-Process -Id $existing5000.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "  Killed existing process on port 5000" -ForegroundColor DarkGray
}

# Start Python DXF scanner as a background job
$dxfJob = Start-Job -ScriptBlock {
    param($dir)
    $env:PYTHONIOENCODING = "utf-8"
    Set-Location $dir
    & "$dir\.venv_new\Scripts\python" -m server.main 2>&1
} -ArgumentList $DXF_SCANNER_DIR

Start-Sleep -Seconds 3

# Check if scanner started
$dxfRunning = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($dxfRunning) {
    Write-Host "  DXF Scanner running on http://localhost:8000" -ForegroundColor Green
}
else {
    Write-Host "  DXF Scanner starting (may take a few seconds)..." -ForegroundColor DarkYellow
}

# --- Step 2: Start Job Tracker in foreground ---
Write-Host ""
Write-Host "[2/2] Starting Job Tracker (port 5000)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Open http://localhost:5000 in your browser" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop everything" -ForegroundColor DarkGray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Run Job Tracker in foreground (so Ctrl+C stops everything)
try {
    Set-Location $JOB_TRACKER_DIR
    npm run dev
}
finally {
    # Cleanup: stop DXF scanner when Job Tracker stops
    Write-Host ""
    Write-Host "Stopping DXF Scanner..." -ForegroundColor Yellow
    Stop-Job $dxfJob -ErrorAction SilentlyContinue
    Remove-Job $dxfJob -Force -ErrorAction SilentlyContinue
    
    $remaining = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($remaining) {
        Stop-Process -Id $remaining.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "All services stopped." -ForegroundColor Green
}
