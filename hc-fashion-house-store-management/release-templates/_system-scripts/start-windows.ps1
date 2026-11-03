# HC Fashion House - Windows start-server + open-browser.
#
# Invoked by the HTA launcher's "Open App" button (the Desktop shortcut
# opens the launcher) and at the end of an install. Idempotent - safe to
# click multiple times. If the server is already running on our chosen port,
# we just open the browser without spawning a duplicate node.exe.
#
# It always starts the Node.js that ships in _system\node, and it never
# downloads or installs anything: a copy with a missing part says so.

$ErrorActionPreference = 'Continue'

$helper = Join-Path $PSScriptRoot 'hcfh-paths.ps1'
if (-not (Test-Path -LiteralPath $helper)) {
  Write-Host '  Missing file: hcfh-paths.ps1. Reinstall from the HC Fashion House ZIP.' -ForegroundColor Red
  if ($env:HCFH_NONINTERACTIVE -ne '1') { Read-Host '  Press Enter to close' }
  exit 1
}
. $helper
Set-HcfhTitle 'HC Fashion House - Server'
$SystemDir = $HcfhSystemDir

if (-not (Test-HcfhReleaseLayout)) {
  Wait-HcfhEnter
  exit 1
}

# Only an installed copy is started. A freshly extracted ZIP holds the whole
# app, so starting it would open a second, empty set of books next to the
# real one - the launcher offers Install there instead.
if (-not (Test-Path -LiteralPath $HcfhInstallMarker)) {
  Write-Host ''
  Write-Host '  This copy of HC Fashion House is not installed.' -ForegroundColor Yellow
  Write-Host '  Open the launcher (HC Fashion House - WINDOWS) and click Install.'
  Wait-HcfhEnter
  exit 1
}

if (Test-HcfhSyncedPath $HcfhAppHome) {
  Write-Host "  Warning: $HcfhAppHome is inside a folder that syncs to the cloud" -ForegroundColor Yellow
  Write-Host '  (OneDrive, Desktop or Documents), so the books are copied there too.' -ForegroundColor Yellow
  Write-Host "  $HcfhContactLine" -ForegroundColor Yellow
}

# The port to look at: data\port.run (the server writes it after a
# successful bind), else data\port.txt (see Get-HcfhPort).
$port = Get-HcfhPort

# The readiness check used to ask with a 1 second timeout, which the WPAD
# proxy look-up alone could exceed (hcfh-paths.ps1 now turns the proxy off):
# "Open App" then concluded the server was down, started a second copy of it
# and told the user it had failed while the app was serving perfectly well.
# Measured 2026-09-23: 1s timeout = always fails; with the proxy off = 0.03s.
if (Test-HcfhServerUp -Port $port) {
  Write-Host "  Server already running on port $port - opening browser..."
  Start-Process "http://localhost:$port/"
  exit 0
}

# Not running -> spawn it detached so the console window can close.
. (Join-Path $SystemDir 'ensure-node.ps1')
$NodeExe = Use-GoodNode
if (-not $NodeExe) {
  Wait-HcfhEnter
  exit 1
}
if (-not (Test-AppPackagesPresent)) {
  # Nothing is downloaded to repair this: the packages come in the ZIP.
  Show-PackagesMissing
  Wait-HcfhEnter
  exit 1
}
Write-Host "  Starting server on port $port..."
Push-Location $SystemDir
Start-Process -FilePath $NodeExe -ArgumentList 'server.js' -WorkingDirectory $SystemDir -WindowStyle Hidden
Pop-Location

# Poll until the server responds. 15 seconds was not enough: the very first
# start after an install is cold - Windows Defender reads every one of the
# freshly written node_modules files as node loads them - and it can take
# the better part of a minute on an ordinary laptop. The user was shown a
# yellow "did not respond" warning and no browser, seconds before the app
# came up perfectly well behind it. Found by installing the real ZIP,
# 2026-09-23.
# The port is read again on every round: when the port is taken the server
# moves to the next free one and writes that into data\port.run.
$deadline = (Get-Date).AddSeconds(90)
$announced = 0
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Milliseconds 400
  $port = Get-HcfhPort
  if (Test-HcfhServerUp -Port $port) {
    Start-Process "http://localhost:$port/"
    exit 0
  }
  # Say something every 10s so a slow first start does not look like a hang.
  $waited = [int]((Get-Date) - $deadline.AddSeconds(-90)).TotalSeconds
  if ($waited -ge $announced + 10) {
    $announced = $waited
    Write-Host "  Still starting... ($waited seconds. The first start after an install is the slow one.)"
  }
}

Write-Host ''
Write-Host '  The server has not answered in 90 seconds.' -ForegroundColor Yellow
Write-Host '  It may still be starting - try this address in your browser:'
Write-Host "  http://localhost:$port/"
Write-Host '  If that does not work, close this window and click Open App again.'
Write-Host "  If it keeps happening: $HcfhContactLine"
Wait-HcfhEnter
