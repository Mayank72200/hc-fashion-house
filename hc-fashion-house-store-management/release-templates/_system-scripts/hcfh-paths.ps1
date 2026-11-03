# HC Fashion House - shared folder locations and helpers for the Windows
# scripts in this folder.
#
# Dot-sourced by start-, stop-, backup-, restore-, move-, install- and
# uninstall-windows.ps1, so every script resolves the same folders as
# server.js does:
#   APP_HOME  = $env:HCFH_HOME when it is set (tests, development),
#               otherwise this _system folder
#   data, Saved Invoices, Trash and logs live under APP_HOME
#   backup ZIPs and the Move ZIP go to <install>\Backups, beside _system -
#   never Documents, Desktop or OneDrive. HCFH_BACKUP_DIR wins when set;
#   with HCFH_HOME set they go to <HCFH_HOME>\Backups.
#
# When the app's server runs a script it sets HCFH_NONINTERACTIVE=1. Nobody
# can answer a prompt then, so every pause is skipped (Wait-HcfhEnter).
#
# Keep this file pure ASCII: Windows PowerShell 5.1 reads a script without a
# BOM in the machine's ANSI codepage.

$HcfhSystemDir   = $PSScriptRoot
$HcfhInstallRoot = Split-Path -Parent $HcfhSystemDir
if ($env:HCFH_HOME) { $HcfhAppHome = $env:HCFH_HOME.TrimEnd('\') } else { $HcfhAppHome = $HcfhSystemDir }
$HcfhDataDir          = Join-Path $HcfhAppHome 'data'
$HcfhPortFile         = Join-Path $HcfhDataDir 'port.txt'
$HcfhPortRunFile      = Join-Path $HcfhDataDir 'port.run'
$HcfhSavedInvoicesDir = Join-Path $HcfhAppHome 'Saved Invoices'
$HcfhTrashDir         = Join-Path $HcfhAppHome 'Trash'
$HcfhLogsDir          = Join-Path $HcfhAppHome 'logs'
if ($env:HCFH_BACKUP_DIR) { $HcfhBackupsDir = $env:HCFH_BACKUP_DIR.TrimEnd('\') }
elseif ($env:HCFH_HOME)   { $HcfhBackupsDir = Join-Path $HcfhAppHome 'Backups' }
else                      { $HcfhBackupsDir = Join-Path $HcfhInstallRoot 'Backups' }

$HcfhDefaultPort   = 47371
# Written by install-windows.ps1 as its last step: a copy only counts as
# installed once this file is there. (The ZIP ships node_modules, so that
# folder can no longer mean "installed".)
$HcfhInstallMarker = Join-Path $HcfhSystemDir 'hcfh-installed.json'
$HcfhLauncherName  = 'HC Fashion House - WINDOWS.hta'
$HcfhShortcutName  = 'HC Fashion House.lnk'
# Where Install puts the app: on this PC only, never a synced folder.
$HcfhProductRoot   = ''
if ($env:LOCALAPPDATA) { $HcfhProductRoot = Join-Path $env:LOCALAPPDATA 'Programs\HC Fashion House' }
$HcfhContactLine   = 'Contact your HC Fashion House administrator.'

# Progress bars slow Compress-Archive down a lot, and nobody watches them.
$global:ProgressPreference = 'SilentlyContinue'

# Windows PowerShell 5.1 runs the system proxy auto-detect (WPAD) on every
# web request - including ones to 127.0.0.1 - and on a machine with a proxy,
# a VPN or a corporate network that costs about two seconds every time.
# These scripts only ever talk to this machine, so the proxy is never wanted.
[System.Net.WebRequest]::DefaultWebProxy = $null

function Set-HcfhTitle([string]$Title) {
  try { $Host.UI.RawUI.WindowTitle = $Title } catch { }
}

# Pauses so a person can read the window - unless the app's server started
# this script, where nobody can press Enter.
function Wait-HcfhEnter([string]$Prompt = '  Press Enter to close') {
  if ($env:HCFH_NONINTERACTIVE -ne '1') { [void](Read-Host $Prompt) }
}

# The scripts work on an installed copy: this folder is "_system" with
# server.js in it. Run from anywhere else (the source tree, say) they would
# treat that folder as the app and back up, restore or stop the wrong thing.
# With HCFH_HOME set (tests, development) the data-only scripts may run from
# the source tree, because the books are then in HCFH_HOME.
function Test-HcfhReleaseLayout([switch]$AllowHcfhHome) {
  $ok = ((Split-Path -Leaf $HcfhSystemDir) -eq '_system') -and
        (Test-Path -LiteralPath (Join-Path $HcfhSystemDir 'server.js'))
  if (-not $ok -and $AllowHcfhHome -and $env:HCFH_HOME) { $ok = $true }
  if (-not $ok) {
    Write-Host '  Run this from an installed HC Fashion House copy.' -ForegroundColor Red
    return $false
  }
  # Never work on a folder that is not there: a mistyped HCFH_HOME must not
  # look like empty books.
  if ($env:HCFH_HOME -and -not (Test-Path -LiteralPath $env:HCFH_HOME -PathType Container)) {
    Write-Host "  HCFH_HOME is set to $($env:HCFH_HOME), but that folder does not exist." -ForegroundColor Red
    Write-Host '  Nothing was changed.'
    return $false
  }
  return $true
}

# The port the server uses: data\port.run (the port it is bound to now,
# written by the server on every start), else data\port.txt (the preferred
# port, written only once, when it is missing), else the default.
function Get-HcfhPort {
  foreach ($file in @($HcfhPortRunFile, $HcfhPortFile)) {
    if (-not (Test-Path -LiteralPath $file)) { continue }
    try {
      $p = ([string](Get-Content -LiteralPath $file -Raw -ErrorAction Stop)).Trim()
      if ($p -match '^\d+$') {
        $n = [int]$p
        if ($n -ge 1024 -and $n -le 65535) { return $n }
      }
    } catch { }
  }
  return $HcfhDefaultPort
}

# The server removes data\port.run when it exits normally; a forced stop
# (Stop-Process) skips that, so whoever stopped it removes the file. Only
# called once no server of this copy is running.
function Remove-HcfhPortRun {
  Remove-Item -LiteralPath $HcfhPortRunFile -Force -ErrorAction SilentlyContinue
}

# Does the app answer on this port? Asks for /api/version, which carries no
# business data.
function Test-HcfhServerUp([int]$Port) {
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/version" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    return ($r.StatusCode -eq 200)
  } catch { return $false }
}

# Process id listening on this port, or 0.
function Get-HcfhListenerPid([int]$Port) {
  if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) {
    $c = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) | Select-Object -First 1
    if ($c) { return [int]$c.OwningProcess }
    return 0
  }
  # Trimmed-down Windows images can lack Get-NetTCPConnection.
  foreach ($line in @(netstat.exe -ano -p TCP 2>$null)) {
    $f = -split [string]$line
    if ($f.Count -ge 5 -and $f[3] -eq 'LISTENING' -and $f[1] -match ":$Port$") { return [int]$f[4] }
  }
  return 0
}

# Is this process the app's server: node.exe from this copy's _system\node,
# running server.js? A development run (HCFH_HOME set) may use another
# node.exe, but it must still be running server.js.
function Test-HcfhAppProcess([int]$ProcId) {
  $name = $null; $exe = $null; $cmd = $null
  try {
    $p = Get-CimInstance -ClassName Win32_Process -Filter "ProcessId = $ProcId" -ErrorAction Stop
    if ($p) { $name = [string]$p.Name; $exe = [string]$p.ExecutablePath; $cmd = [string]$p.CommandLine }
  } catch { }
  if (-not $name) {
    try {
      $gp = Get-Process -Id $ProcId -ErrorAction Stop
      $name = [string]$gp.ProcessName + '.exe'
      $exe = [string]$gp.Path
    } catch { }
  }
  $result = [pscustomobject]@{ IsApp = $false; Name = $name }
  if ($name -notmatch '^node(\.exe)?$') { return $result }
  if ($cmd -and $cmd -notmatch 'server\.js') { return $result }
  $bundled = Join-Path $HcfhSystemDir 'node\node.exe'
  if ($exe -and (Test-HcfhSamePath $exe $bundled)) { $result.IsApp = $true; return $result }
  if ($env:HCFH_HOME -and $cmd) { $result.IsApp = $true }
  return $result
}

# Stops this app's server on $Port and waits until the port is free. Another
# program on that port is never touched. State is one of: not-running,
# stopped, not-ours, failed.
function Stop-HcfhServer([int]$Port) {
  $res = [pscustomobject]@{ State = 'not-running'; Pid = 0; Name = '' }
  $procId = Get-HcfhListenerPid $Port
  if (-not $procId) {
    # Nothing listens - unless the port lookup itself cannot see it.
    if (Test-HcfhServerUp $Port) { $res.State = 'failed' }
  } else {
    $who = Test-HcfhAppProcess $procId
    $res.Pid = $procId
    $res.Name = $who.Name
    if (-not $who.IsApp) {
      $res.State = 'not-ours'
    } else {
      # An error here may only mean it was exiting anyway: the port decides.
      try { Stop-Process -Id $procId -Force -ErrorAction Stop } catch { }
      $res.State = 'failed'
      for ($i = 0; $i -lt 50; $i++) {
        Start-Sleep -Milliseconds 200
        if ((Get-HcfhListenerPid $Port) -ne $procId) { $res.State = 'stopped'; break }
      }
    }
  }
  # This copy's own node.exe runs nothing but this app's server. If one is
  # still running (on another port, say), it is the app too: stop it, so a
  # restore or an uninstall never works under a running server.
  if ($res.State -ne 'failed') {
    $bundled = Join-Path $HcfhSystemDir 'node\node.exe'
    foreach ($p in @(Get-Process -Name node -ErrorAction SilentlyContinue)) {
      if ($p.Id -eq $procId) { continue }   # the listener stopped above, still exiting
      $path = $null
      try { $path = [string]$p.Path } catch { }
      if (-not $path -or -not (Test-HcfhSamePath $path $bundled)) { continue }
      try {
        Stop-Process -Id $p.Id -Force -ErrorAction Stop
        Wait-Process -Id $p.Id -Timeout 10 -ErrorAction SilentlyContinue
        if ($res.State -ne 'stopped') { $res.State = 'stopped'; $res.Pid = $p.Id; $res.Name = 'node.exe' }
      } catch {
        # Already gone counts as stopped; still there is a failure.
        if (Get-Process -Id $p.Id -ErrorAction SilentlyContinue) { $res.State = 'failed' }
      }
    }
  }
  # Nothing of this copy runs now, so a port.run left behind is stale.
  if ($res.State -eq 'stopped' -or $res.State -eq 'not-running') { Remove-HcfhPortRun }
  return $res
}

function Test-HcfhSamePath([string]$A, [string]$B) {
  if (-not $A -or -not $B) { return $false }
  try { $A = [IO.Path]::GetFullPath($A) } catch { }
  try { $B = [IO.Path]::GetFullPath($B) } catch { }
  return [string]::Equals($A.TrimEnd('\'), $B.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase)
}

# Folders whose contents are copied to the cloud on many PCs: the OneDrive
# roots, and the Desktop and Documents folders (often redirected into
# OneDrive). Only these roots are matched - never any folder that merely has
# "OneDrive" in its name.
function Get-HcfhSyncedRoots {
  $roots = @()
  foreach ($v in @($env:OneDrive, $env:OneDriveCommercial, $env:OneDriveConsumer)) { if ($v) { $roots += $v } }
  foreach ($f in @('Desktop', 'MyDocuments')) {
    try { $p = [Environment]::GetFolderPath($f); if ($p) { $roots += $p } } catch { }
  }
  if ($env:USERPROFILE) {
    $roots += (Join-Path $env:USERPROFILE 'Desktop')
    $roots += (Join-Path $env:USERPROFILE 'Documents')
  }
  return $roots
}

function Test-HcfhSyncedPath([string]$Path) {
  if (-not $Path) { return $false }
  try { $Path = [IO.Path]::GetFullPath($Path) } catch { }
  $p = $Path.TrimEnd('\') + '\'
  foreach ($r in Get-HcfhSyncedRoots) {
    if (-not $r) { continue }
    $rr = $r.TrimEnd('\') + '\'
    if ($p.StartsWith($rr, [StringComparison]::OrdinalIgnoreCase)) { return $true }
  }
  return $false
}

# An installed copy somewhere other than $Exclude: the folder an
# "HC Fashion House.lnk" shortcut points at, or the standard program folder.
function Find-HcfhOtherInstall([string]$Exclude) {
  $roots = @()
  foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {
    # One unreadable or empty shortcut must not stop the others being checked.
    try {
      $lnk = Join-Path $dir $HcfhShortcutName
      if (Test-Path -LiteralPath $lnk) {
        $roots += Split-Path -Parent ([string](New-Object -ComObject WScript.Shell).CreateShortcut($lnk).Arguments).Trim().Trim('"')
      }
    } catch { }
  }
  $roots += $HcfhProductRoot
  foreach ($r in $roots) {
    if (-not $r -or (Test-HcfhSamePath $r $Exclude)) { continue }
    if ((Test-Path -LiteralPath (Join-Path $r '_system\server.js')) -and
        (Test-Path -LiteralPath (Join-Path $r '_system\hcfh-installed.json'))) { return $r }
  }
  return $null
}

function Get-HcfhInvoiceCount([string]$DataDir) {
  $bills = Join-Path $DataDir 'bills'
  if (-not (Test-Path -LiteralPath $bills)) { return 0 }
  return @(Get-ChildItem -LiteralPath $bills -Filter '*.json' -File -ErrorAction SilentlyContinue).Count
}

# ZIPs everything in the data folder, with the entries at the root of the
# ZIP - the format restore-windows.ps1 reads. data\port.run is left out: it
# is the running server's port on this PC, not part of the books. Returns
# $false when the folder is empty; throws when the ZIP could not be written.
function New-HcfhDataZip([string]$OutFile) {
  $items = @(Get-ChildItem -LiteralPath $HcfhDataDir -Force -ErrorAction Stop |
    Where-Object { $_.Name -ne 'port.run' } | ForEach-Object { $_.FullName })
  if ($items.Count -eq 0) { return $false }
  Compress-Archive -LiteralPath $items -DestinationPath $OutFile -Force -ErrorAction Stop
  if (-not (Test-Path -LiteralPath $OutFile) -or (Get-Item -LiteralPath $OutFile).Length -eq 0) {
    throw "The ZIP was not written: $OutFile"
  }
  return $true
}
