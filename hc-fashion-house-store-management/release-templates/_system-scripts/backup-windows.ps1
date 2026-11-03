# HC Fashion House - Windows backup.
#
# Zips the entire data/ folder into
#   <backups folder>\backup-YYYY-MM-DD_HH-mm-ss.zip
# The backups folder is <install>\Backups, beside _system (see
# hcfh-paths.ps1) - never Documents or the Desktop, which OneDrive copies to
# the cloud on many PCs. Opens the folder in Explorer so the user knows where
# it went.

$ErrorActionPreference = 'Stop'

$helper = Join-Path $PSScriptRoot 'hcfh-paths.ps1'
if (-not (Test-Path -LiteralPath $helper)) {
  Write-Host '  Missing file: hcfh-paths.ps1. Reinstall from the HC Fashion House ZIP.' -ForegroundColor Red
  exit 1
}
. $helper
Set-HcfhTitle 'HC Fashion House - Backup'

if (-not (Test-HcfhReleaseLayout -AllowHcfhHome)) { exit 1 }

if (-not (Test-Path -LiteralPath $HcfhDataDir)) {
  Write-Host '  No data folder found - nothing to back up.' -ForegroundColor Yellow
  Wait-HcfhEnter
  exit 0
}

$stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$out = Join-Path $HcfhBackupsDir "backup-$stamp.zip"
try {
  if (-not (Test-Path -LiteralPath $HcfhBackupsDir)) { New-Item -ItemType Directory -Path $HcfhBackupsDir -Force | Out-Null }
  Write-Host ''
  Write-Host "  Backing up data folder -> $out ..."
  if (-not (New-HcfhDataZip -OutFile $out)) {
    Write-Host '  The data folder is empty - nothing to back up.' -ForegroundColor Yellow
    Wait-HcfhEnter
    exit 0
  }
} catch {
  Write-Host ''
  Write-Host "  The backup did not work: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  Your data was not changed. Try again; if it keeps failing: $HcfhContactLine"
  Wait-HcfhEnter
  exit 1
}

$sizeMB = [Math]::Round((Get-Item -LiteralPath $out).Length / 1MB, 2)
Write-Host ''
Write-Host "  [OK] Backup created - $sizeMB MB" -ForegroundColor Green
Write-Host "     $out"
Write-Host ''
Write-Host '  Copy it to a USB drive now and then. It holds your whole books:'
Write-Host '  keep it off OneDrive and e-mail.'
Write-Host '  Opening backups folder in Explorer...'
try { Start-Process explorer.exe "/select,`"$out`"" } catch { }
Start-Sleep 1
exit 0
