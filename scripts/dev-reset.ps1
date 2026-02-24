$ErrorActionPreference = 'SilentlyContinue'

# Stop Next.js Node processes (avoid killing the npm process running this script)
$nextNodeProcs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object {
    $_.CommandLine -match "next(\\dist\\bin\\next|/dist/bin/next)" -or
    $_.CommandLine -match "\bnext\b\s+(dev|start)" -or
    $_.CommandLine -match "\bnext-server\b"
  }

foreach ($p in $nextNodeProcs) {
  Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}

# Clear Next.js / build caches that can corrupt on Windows
if (Test-Path '.next') {
  Remove-Item -Recurse -Force '.next' -ErrorAction SilentlyContinue
}

if (Test-Path 'node_modules\.cache') {
  Remove-Item -Recurse -Force 'node_modules\.cache' -ErrorAction SilentlyContinue
}

if (Test-Path '.turbo') {
  Remove-Item -Recurse -Force '.turbo' -ErrorAction SilentlyContinue
}

Write-Output 'dev-reset-done'
exit 0
