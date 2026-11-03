# HC Fashion House - Windows uninstaller.
#
# Run from the HTA launcher: More options -> Uninstall. It removes the
# program only: the Desktop and Start Menu shortcuts that open THIS copy,
# the launcher beside _system, and the program files inside _system. It
# never deletes the books - the data folder, the saved invoice PDFs (Saved
# Invoices), Trash, logs and the Backups folder all stay where they are, and
# _system is made visible so they are easy to find. Installing HC Fashion
# House again into the same folder picks them up.
#
# Nothing happens until the user types UNINSTALL. It refuses to run when the
# app's server started it (HCFH_NONINTERACTIVE=1), or when HCFH_HOME is set
# (the books are then somewhere else).
#
# Links inside the program folder (junctions, symbolic links) are removed as
# links; what they point at is never touched.

$ErrorActionPreference = 'Continue'

$helper = Join-Path $PSScriptRoot 'hcfh-paths.ps1'
if (-not (Test-Path -LiteralPath $helper)) {
  Write-Host '  Missing file: hcfh-paths.ps1. Nothing was changed.' -ForegroundColor Red
  if ($env:HCFH_NONINTERACTIVE -ne '1') { Read-Host '  Press Enter to close' }
  exit 1
}
. $helper
Set-HcfhTitle 'HC Fashion House - Uninstall'

if ($env:HCFH_NONINTERACTIVE -eq '1') {
  Write-Host '  Uninstall runs only from the launcher window. Nothing was changed.'
  exit 1
}
if (-not (Test-HcfhReleaseLayout)) {
  Wait-HcfhEnter
  exit 1
}
if ($env:HCFH_HOME) {
  Write-Host '  HCFH_HOME is set, so this copy keeps its books somewhere else.' -ForegroundColor Yellow
  Write-Host "  Nothing was changed. $HcfhContactLine"
  Wait-HcfhEnter
  exit 1
}

$RootDir = $HcfhInstallRoot
$invoices = Get-HcfhInvoiceCount $HcfhDataDir

Write-Host ''
Write-Host '  ============================================================'
Write-Host '   HC Fashion House - Uninstall'
Write-Host '  ============================================================'
Write-Host ''
Write-Host "  This removes the program from $RootDir"
Write-Host '  and its Desktop and Start Menu shortcuts.'
Write-Host ''
Write-Host '  It KEEPS your books. Nothing in these folders is deleted:'
Write-Host "    $HcfhDataDir  ($invoices invoices)"
Write-Host "    $HcfhSavedInvoicesDir"
Write-Host "    $HcfhBackupsDir"
Write-Host ''
Write-Host '  Tip: back up first (launcher -> More options -> Back up my data).'
Write-Host ''
$answer = ''
if ($env:HCFH_NONINTERACTIVE -ne '1') { $answer = Read-Host '  Type UNINSTALL and press Enter to go ahead (anything else cancels)' }
if (([string]$answer).Trim() -ne 'UNINSTALL') {
  Write-Host '  Cancelled. Nothing was changed.'
  Wait-HcfhEnter
  exit 0
}

# --- Stop the app first: its node.exe is one of the files to remove ---
$port = Get-HcfhPort
$stop = Stop-HcfhServer -Port $port
if ($stop.State -eq 'failed') {
  Write-Host "  The app could not be stopped (port $port). Nothing was changed." -ForegroundColor Red
  Write-Host "  Restart the PC, then try again. $HcfhContactLine"
  Wait-HcfhEnter
  exit 1
}

# From here on this copy no longer counts as installed.
Remove-Item -LiteralPath $HcfhInstallMarker -Force -ErrorAction SilentlyContinue
$failed = @()

# --- Shortcuts that open this copy (any other shortcut is left alone) ---
$launcher = Join-Path $RootDir $HcfhLauncherName
foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
  if (-not $dir) { continue }
  $lnk = Join-Path $dir $HcfhShortcutName
  if (-not (Test-Path -LiteralPath $lnk)) { continue }
  try {
    $target = ([string](New-Object -ComObject WScript.Shell).CreateShortcut($lnk).Arguments).Trim().Trim('"')
    if (Test-HcfhSamePath $target $launcher) {
      Remove-Item -LiteralPath $lnk -Force -ErrorAction Stop
      Write-Host "  Removed shortcut: $lnk"
    }
  } catch { $failed += $lnk }
}

# --- Program files in _system: everything except the books ---
$keep = @('data', 'Saved Invoices', 'Trash', 'logs')
foreach ($item in @(Get-ChildItem -LiteralPath $HcfhSystemDir -Force)) {
  if ($keep -contains $item.Name) { continue }
  # A folder left by an interrupted restore may hold earlier books.
  if ($item.PSIsContainer -and $item.Name -like 'hcfh-*') { continue }
  try {
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
      # A link: remove the link itself, never what it points at.
      if ($item.PSIsContainer) { [IO.Directory]::Delete($item.FullName) } else { [IO.File]::Delete($item.FullName) }
    } elseif ($item.PSIsContainer) {
      # .NET removes links found inside the tree without following them.
      [IO.Directory]::Delete($item.FullName, $true)
    } else {
      Remove-Item -LiteralPath $item.FullName -Force -ErrorAction Stop
    }
  } catch { }
  if (Test-Path -LiteralPath $item.FullName) { $failed += $item.FullName }
}

# --- The launcher files beside _system ---
foreach ($name in @($HcfhLauncherName, 'READ ME FIRST.txt', 'desktop.ini')) {
  $p = Join-Path $RootDir $name
  if (-not (Test-Path -LiteralPath $p)) { continue }
  Remove-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue
  if (Test-Path -LiteralPath $p) { $failed += $p }
}
# The read-only bit only told Windows to read desktop.ini. _system becomes
# visible so the books are easy to find.
attrib -R "$RootDir" 2>$null
attrib -H "$HcfhSystemDir" 2>$null

$note = Join-Path $RootDir 'HC Fashion House was removed - READ ME.txt'
$lines = @(
  "HC Fashion House was removed from this PC on $(Get-Date -Format 'yyyy-MM-dd HH:mm').",
  '',
  'Your books were NOT deleted. They are still here:',
  "  $HcfhDataDir",
  "  $HcfhSavedInvoicesDir",
  "  $HcfhBackupsDir",
  '',
  'To use them again, install HC Fashion House again: the installer finds',
  'them in this folder and keeps using them.',
  '',
  'To remove them for good, first copy what you want to keep (the Backups',
  'folder, for example) to a USB drive, then delete this folder.',
  '',
  $HcfhContactLine
)
Set-Content -LiteralPath $note -Value $lines -Encoding UTF8 -ErrorAction SilentlyContinue

Write-Host ''
if ($failed.Count -eq 0) {
  Write-Host '  ============================================================'
  Write-Host '   Done - HC Fashion House was removed.' -ForegroundColor Green
  Write-Host '  ============================================================'
} else {
  Write-Host '  Done, except for these, which are in use:' -ForegroundColor Yellow
  foreach ($f in $failed) { Write-Host "    $f" }
  Write-Host '  Close the launcher window, then delete them by hand.'
}
Write-Host ''
Write-Host "  Your books are still in $RootDir"
Write-Host '  (data, Saved Invoices and Backups). To use them again, install'
Write-Host '  HC Fashion House again; the installer finds them and keeps using them.'
Write-Host ''
Write-Host '  If the app was also added to the browser as an app window, you can'
Write-Host '  remove it from the browser''s list of apps.'
Write-Host ''
Write-Host '  You can close the launcher window now.'
Wait-HcfhEnter
exit 0
