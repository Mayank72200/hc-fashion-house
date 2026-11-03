# HC Fashion House - Windows "Move to Another PC" export.
#
# Zips just the data folder - matching the backup format - into the backups
# folder (<install>\Backups, see hcfh-paths.ps1) with a "MOVE" prefix +
# timestamp. Not the Desktop: on many PCs OneDrive copies the Desktop to the
# cloud. User copies that file to the new PC (USB drive), installs
# HC Fashion House there (fresh HTA launcher install), then uses
# "Restore a backup" to pull their invoices in.

$ErrorActionPreference = 'Stop'

$helper = Join-Path $PSScriptRoot 'hcfh-paths.ps1'
if (-not (Test-Path -LiteralPath $helper)) {
  Write-Host '  Missing file: hcfh-paths.ps1. Reinstall from the HC Fashion House ZIP.' -ForegroundColor Red
  exit 1
}
. $helper
Set-HcfhTitle 'HC Fashion House - Move to Another PC'

if (-not (Test-HcfhReleaseLayout -AllowHcfhHome)) { exit 1 }

if (-not (Test-Path -LiteralPath $HcfhDataDir)) {
  Write-Host '  No data folder to export.' -ForegroundColor Yellow
  Wait-HcfhEnter
  exit 0
}

$stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$out = Join-Path $HcfhBackupsDir "MOVE-HCFashionHouse-$stamp.zip"
try {
  if (-not (Test-Path -LiteralPath $HcfhBackupsDir)) { New-Item -ItemType Directory -Path $HcfhBackupsDir -Force | Out-Null }
  Write-Host ''
  Write-Host "  Exporting your data -> $out ..."
  if (-not (New-HcfhDataZip -OutFile $out)) {
    Write-Host '  The data folder is empty - nothing to export.' -ForegroundColor Yellow
    Wait-HcfhEnter
    exit 0
  }
} catch {
  Write-Host ''
  Write-Host "  The export did not work: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  Your data was not changed. Try again; if it keeps failing: $HcfhContactLine"
  Wait-HcfhEnter
  exit 1
}

$sizeMB = [Math]::Round((Get-Item -LiteralPath $out).Length / 1MB, 2)
Write-Host ''
Write-Host "  [OK] Export ready - $sizeMB MB" -ForegroundColor Green
Write-Host "     $out"
Write-Host ''
Write-Host '  How to import on the new PC:'
Write-Host '    1. Install HC Fashion House on the new PC (double-click the HTA launcher there).'
Write-Host '    2. Copy this ZIP over on a USB drive.'
Write-Host '    3. Open the launcher on the new PC -> More options -> "Restore a backup" -> pick this ZIP.'
Write-Host '  Saved invoice PDFs are not in this ZIP; to take them along, copy the'
Write-Host "  folder $HcfhSavedInvoicesDir too."
Write-Host ''
try { Start-Process explorer.exe "/select,`"$out`"" } catch { }
Start-Sleep 1
exit 0
