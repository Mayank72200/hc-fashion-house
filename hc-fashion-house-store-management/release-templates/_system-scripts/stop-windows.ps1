# HC Fashion House - Windows stop-server.
#
# Stops this app's server: the node.exe from this copy's _system\node that
# listens on the app's port. Any other program on that port is left alone.
# Safe if nothing is running (no error, quick exit). After a successful stop
# data\port.run is deleted (Stop-HcfhServer in hcfh-paths.ps1): the forced
# stop skips the server's own clean-up of that file.

$ErrorActionPreference = 'SilentlyContinue'

$helper = Join-Path $PSScriptRoot 'hcfh-paths.ps1'
if (-not (Test-Path -LiteralPath $helper)) {
  Write-Host '  Missing file: hcfh-paths.ps1. Reinstall from the HC Fashion House ZIP.' -ForegroundColor Red
  exit 1
}
. $helper
Set-HcfhTitle 'HC Fashion House - Stop Server'

if (-not (Test-HcfhReleaseLayout -AllowHcfhHome)) { exit 1 }

$port = Get-HcfhPort
$result = Stop-HcfhServer -Port $port
$code = 0
switch ($result.State) {
  'not-running' {
    Write-Host "  Server is not running on port $port."
  }
  'stopped' {
    Write-Host "  Stopped server on port $port (PID $($result.Pid))."
  }
  'not-ours' {
    Write-Host "  Port $port is used by another program ($($result.Name), PID $($result.Pid))," -ForegroundColor Yellow
    Write-Host '  not by HC Fashion House, so it was left running.' -ForegroundColor Yellow
    $code = 1
  }
  default {
    Write-Host "  Could not stop the server on port $port." -ForegroundColor Red
    Write-Host "  Restart the PC to stop it. $HcfhContactLine"
    $code = 1
  }
}
if ($code -ne 0) { Wait-HcfhEnter }
Start-Sleep 1
exit $code
