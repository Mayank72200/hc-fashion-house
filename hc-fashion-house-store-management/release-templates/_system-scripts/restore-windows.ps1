# HC Fashion House - Windows restore-from-backup.
#
# Puts a backup ZIP (from "Back up my data" or "Move to another PC") back as
# the app's data folder. Never destructive without a pre-restore snapshot:
#   1. pick the ZIP. It must look like an HC Fashion House data backup; an
#      app package or any other ZIP is refused before anything changes.
#   2. stop this app's server (only its own node.exe), so nothing writes to
#      the data folder during the swap
#   3. save the current data as pre-restore-<stamp>.zip in the backups folder
#   4. extract the backup into a staging folder beside data\ and swap the two
#      folders; if the swap fails, the old data folder is put straight back
# This PC's daily snapshots (data\backups) and its port are kept; a stale
# data\port.run is never restored. Saved invoice PDFs are not part of backup
# ZIPs and are left as they are.
#
# From the app's Control Panel (HCFH_NONINTERACTIVE=1) the server that ran
# this script is the one that has to stop - and stopping it would end this
# script with it. So after the pick and the checks the work moves to a new,
# visible window (-Handoff) and this copy returns at once with "RESTART
# NEEDED". The app closes a few seconds later; staff open it again when the
# restore window says Done.

param(
  [string]$ZipPath = '',
  [switch]$Handoff
)

$ErrorActionPreference = 'Stop'

$helper = Join-Path $PSScriptRoot 'hcfh-paths.ps1'
if (-not (Test-Path -LiteralPath $helper)) {
  Write-Host '  Missing file: hcfh-paths.ps1. Reinstall from the HC Fashion House ZIP.' -ForegroundColor Red
  exit 1
}
. $helper
Set-HcfhTitle 'HC Fashion House - Restore'

if (-not (Test-HcfhReleaseLayout -AllowHcfhHome)) { exit 1 }

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Windows.Forms

# Reads the ZIP's list of files without extracting anything. Ok is $true when
# it holds HC Fashion House data: bills\, meta.json or profile.json at its
# root (the format the backup and Move scripts write) or in a data\ folder.
function Get-BackupZipInfo([string]$Path) {
  $info = [pscustomobject]@{ Ok = $false; Reason = ''; Prefix = ''; Invoices = 0 }
  if (-not $Path -or -not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    $info.Reason = "The file was not found: $Path"
    return $info
  }
  try {
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    try { $names = @($zip.Entries | ForEach-Object { $_.FullName.Replace('\', '/') }) }
    finally { $zip.Dispose() }
  } catch {
    $info.Reason = 'The file could not be opened as a ZIP.'
    return $info
  }
  if ($names.Count -eq 0) { $info.Reason = 'The ZIP is empty.'; return $info }
  foreach ($n in $names) {
    if ($n.StartsWith('/') -or $n -match '^[A-Za-z]:' -or $n -match '(^|/)\.\.(/|$)') {
      $info.Reason = "The ZIP contains an unsafe file name ($n)."
      return $info
    }
  }
  if (@($names | Where-Object { $_ -match '(^|/)server\.js$' -or $_ -match '(^|/)_system/' }).Count -gt 0) {
    $info.Reason = 'This is an app package (it holds the program files), not a backup of your data.'
    return $info
  }
  foreach ($prefix in @('', 'data/')) {
    $hits = @($names | Where-Object {
      $_ -eq "${prefix}meta.json" -or $_ -eq "${prefix}profile.json" -or
      $_.StartsWith("${prefix}bills/") -or $_.StartsWith("${prefix}profiles/") })
    if ($hits.Count -gt 0) {
      $info.Ok = $true
      $info.Prefix = $prefix
      $pattern = '^' + [regex]::Escape($prefix) + 'bills/[^/]+\.json$'
      $info.Invoices = @($names | Where-Object { $_ -match $pattern }).Count
      return $info
    }
  }
  $info.Reason = 'This ZIP is not an HC Fashion House backup (no bills, meta.json or profile.json inside).'
  return $info
}

$stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$caption = 'HC Fashion House - Restore'

if (-not $Handoff) {
  # A hidden, always-on-top owner window: without it the dialogs can open
  # behind the browser, where nobody sees them.
  $owner = New-Object System.Windows.Forms.Form
  $owner.TopMost = $true
  $owner.ShowInTaskbar = $false
  try {
    if (-not $ZipPath) {
      if (-not (Test-Path -LiteralPath $HcfhBackupsDir)) { New-Item -ItemType Directory -Path $HcfhBackupsDir -Force | Out-Null }
      $dlg = New-Object System.Windows.Forms.OpenFileDialog
      $dlg.Title = 'Select an HC Fashion House backup ZIP'
      $dlg.Filter = 'ZIP files (*.zip)|*.zip'
      $dlg.InitialDirectory = $HcfhBackupsDir
      if ($dlg.ShowDialog($owner) -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-Host '  Cancelled. Nothing was changed.'
        exit 0
      }
      $ZipPath = $dlg.FileName
    }

    $info = Get-BackupZipInfo $ZipPath
    if (-not $info.Ok) {
      Write-Host "  $($info.Reason)" -ForegroundColor Red
      Write-Host '  Nothing was changed.'
      [void][System.Windows.Forms.MessageBox]::Show($owner, "$($info.Reason)`n`nNothing was changed.", $caption,
        [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
      exit 1
    }

    $current = Get-HcfhInvoiceCount $HcfhDataDir
    $question = "Restore this backup?`n`n" + [IO.Path]::GetFileName($ZipPath) + "`n" +
      "Invoices in the backup: $($info.Invoices)`n" +
      "Invoices on this PC now: $current`n`n" +
      'Your current data is saved first, as a pre-restore ZIP in the backups folder. ' +
      'The app closes while the restore runs.'
    $answer = [System.Windows.Forms.MessageBox]::Show($owner, $question, $caption,
      [System.Windows.Forms.MessageBoxButtons]::YesNo, [System.Windows.Forms.MessageBoxIcon]::Question)
    if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) {
      Write-Host '  Cancelled. Nothing was changed.'
      exit 0
    }
  } finally {
    $owner.Dispose()
  }

  if ($env:HCFH_NONINTERACTIVE -eq '1') {
    # Started by the app's server: finish in a window of its own (see top).
    # That window is for a person to read, so it is interactive again.
    Remove-Item Env:\HCFH_NONINTERACTIVE -ErrorAction SilentlyContinue
    $argLine = '-NoProfile -ExecutionPolicy Bypass -File "' + $PSCommandPath + '" -Handoff -ZipPath "' + $ZipPath + '"'
    try {
      Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList $argLine -WindowStyle Normal
    } catch {
      Write-Host "  The restore window could not be opened: $($_.Exception.Message)" -ForegroundColor Red
      Write-Host '  Nothing was changed. Use the launcher instead: More options -> Restore a backup.'
      exit 1
    }
    Write-Host '  Restore started in a new window.'
    Write-Host '  RESTART NEEDED: the app closes in a few seconds. When the restore window'
    Write-Host '  says Done, open HC Fashion House again from its shortcut.'
    exit 0
  }
} else {
  Write-Host ''
  Write-Host '  Restoring a backup. The app closes in a few seconds...'
  # Gives the app time to answer the page that started this restore.
  Start-Sleep -Seconds 4
  $info = Get-BackupZipInfo $ZipPath
  if (-not $info.Ok) {
    Write-Host "  $($info.Reason)" -ForegroundColor Red
    Write-Host '  Nothing was changed; the app is still running.'
    Wait-HcfhEnter
    exit 1
  }
}

# --- Stop the app ---
Write-Host '  Stopping the app...'
$port = Get-HcfhPort
$stop = Stop-HcfhServer -Port $port
if ($stop.State -eq 'failed') {
  Write-Host "  The app could not be stopped (port $port). Nothing was changed." -ForegroundColor Red
  Write-Host "  Restart the PC, then try again. $HcfhContactLine"
  Wait-HcfhEnter
  exit 1
}

# --- Safety snapshot, then extract beside data\ (same drive: the swap is a rename) ---
$stage = Join-Path $HcfhAppHome ('hcfh-' + [Guid]::NewGuid().ToString('N'))
$preRestore = $null
try {
  if (Test-Path -LiteralPath $HcfhDataDir) {
    if (-not (Test-Path -LiteralPath $HcfhBackupsDir)) { New-Item -ItemType Directory -Path $HcfhBackupsDir -Force | Out-Null }
    $preRestore = Join-Path $HcfhBackupsDir "pre-restore-$stamp.zip"
    Write-Host "  Saving the current data -> $preRestore ..."
    if (-not (New-HcfhDataZip -OutFile $preRestore)) { $preRestore = $null }
  }
  Write-Host '  Extracting the backup...'
  $newRoot = Join-Path $stage 'new'
  New-Item -ItemType Directory -Path $newRoot -Force | Out-Null
  [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $newRoot)
  $newData = $newRoot
  if ($info.Prefix) { $newData = Join-Path $newRoot 'data' }
  if (-not (Test-Path -LiteralPath $newData -PathType Container)) { throw 'The backup did not extract as expected.' }
} catch {
  $why = $_.Exception.Message
  Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
  Write-Host ''
  Write-Host "  The restore stopped before changing anything: $why" -ForegroundColor Red
  Write-Host '  Your data is as it was. Open the app again from its shortcut.'
  Write-Host "  $HcfhContactLine"
  Wait-HcfhEnter
  exit 1
}

# --- Swap: the current data folder steps aside, the backup takes its place ---
$oldData = Join-Path $stage 'previous-data'
$hadData = Test-Path -LiteralPath $HcfhDataDir
try {
  if ($hadData) {
    # An antivirus scan can hold a file for a moment: try a few times.
    for ($attempt = 1; ; $attempt++) {
      try { Move-Item -LiteralPath $HcfhDataDir -Destination $oldData -ErrorAction Stop; break }
      catch { if ($attempt -ge 5) { throw }; Start-Sleep -Seconds 1 }
    }
  }
  Move-Item -LiteralPath $newData -Destination $HcfhDataDir -ErrorAction Stop
} catch {
  $why = $_.Exception.Message
  $oldIsBack = $true
  if ($hadData -and -not (Test-Path -LiteralPath $HcfhDataDir)) {
    try { Move-Item -LiteralPath $oldData -Destination $HcfhDataDir -ErrorAction Stop } catch { $oldIsBack = $false }
  }
  Write-Host ''
  Write-Host "  The restore could not swap the folders: $why" -ForegroundColor Red
  if ($oldIsBack) {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host '  Your data is as it was. Close any window that shows the data folder, then try again.'
  } else {
    # Never delete the only copy: say where it is.
    Write-Host "  IMPORTANT: your previous data is in $oldData" -ForegroundColor Yellow
    if ($preRestore) { Write-Host "  and in $preRestore." -ForegroundColor Yellow }
    Write-Host '  Do not delete them.' -ForegroundColor Yellow
  }
  Write-Host "  $HcfhContactLine"
  Wait-HcfhEnter
  exit 1
}

# --- Keep what belongs to this PC: its daily snapshots and its port ---
$keptAll = $true
try {
  $oldBackups = Join-Path $oldData 'backups'
  if (Test-Path -LiteralPath $oldBackups) {
    $newBackups = Join-Path $HcfhDataDir 'backups'
    if (-not (Test-Path -LiteralPath $newBackups)) { New-Item -ItemType Directory -Path $newBackups -Force | Out-Null }
    foreach ($d in @(Get-ChildItem -LiteralPath $oldBackups -Force)) {
      $target = Join-Path $newBackups $d.Name
      if (-not (Test-Path -LiteralPath $target)) { Move-Item -LiteralPath $d.FullName -Destination $target -ErrorAction Stop }
    }
  }
  $oldPort = Join-Path $oldData 'port.txt'
  if (Test-Path -LiteralPath $oldPort) { Copy-Item -LiteralPath $oldPort -Destination $HcfhPortFile -Force -ErrorAction Stop }
  # A port.run inside the backup named the port of a server that ran when the
  # backup was made; it must not steer the launcher now.
  Remove-HcfhPortRun
} catch {
  $keptAll = $false
}
if ($keptAll) { Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue }

Write-Host ''
Write-Host '  ============================================================'
Write-Host '   Done - the backup is restored.' -ForegroundColor Green
Write-Host '  ============================================================'
Write-Host "  Restored from: $ZipPath"
if ($preRestore) { Write-Host "  Your data from before the restore is saved as: $preRestore" }
if (-not $keptAll) {
  Write-Host "  Some of this PC's daily snapshots could not be moved back; they are in" -ForegroundColor Yellow
  Write-Host "  $oldData" -ForegroundColor Yellow
}
Write-Host '  Saved invoice PDFs (Saved Invoices) were not changed.'
Write-Host ''
Write-Host '  Open HC Fashion House again: double-click its shortcut and click Open App.'
Wait-HcfhEnter
exit 0
