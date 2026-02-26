$ErrorActionPreference = "Stop"
$env:PYTHONIOENCODING = "utf-8"

# Ensure we are in the project root
Set-Location $PSScriptRoot

Write-Host "Starting IFC Geometry Server..."
Write-Host "Project Root: $PSScriptRoot"

# check if .venv exists
if (Test-Path ".venv_new") {
    $pythonPath = ".venv_new\Scripts\python.exe"
}
elseif (Test-Path ".venv") {
    $pythonPath = ".venv\Scripts\python.exe"
}
else {
    Write-Host "Error: .venv not found. Please create a virtual environment." -ForegroundColor Red
    exit 1
}


# Run the server in a try/catch block to ensure window stays open on error
try {
    Write-Host "Server starting on http://localhost:8000 (Open this in your browser)" -ForegroundColor Green
    Start-Process -FilePath $pythonPath -ArgumentList "-m server.main" -WorkingDirectory $PSScriptRoot
}
catch {
    Write-Host "Server crashed: $_" -ForegroundColor Red
}
finally {
    Write-Host "Press Enter to exit..."
    Read-Host
}
