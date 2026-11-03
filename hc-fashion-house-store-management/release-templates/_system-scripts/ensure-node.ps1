# HC Fashion House - check this PC has what the app needs, and say in plain
# words what to do about anything that is missing.
#
# Dot-sourced by install-windows.ps1 and start-windows.ps1.
#
# The HC Fashion House ZIP brings everything the app runs on: Node.js in
# _system\node and the app packages in _system\node_modules. So nothing is
# ever downloaded, npm never runs on this PC, and nothing is installed into
# Windows. The app always uses that bundled node.exe, even when the PC has
# another Node.js of its own.
#
# What is checked, and what happens when it fails:
#   Windows 10 or 11          -> say so (Node.js does not run on 7 / 8)
#   the bundled Node.js       -> say the ZIP is incomplete; reinstall from it
#   the bundled app packages  -> the same
#   app folder writable       -> say what blocks it
#   free disk space           -> say how much is needed

$MinNodeMajor = 18           # package.json "engines"
$AppNodeDir = Join-Path $PSScriptRoot 'node'
$AppNodeExe = Join-Path $AppNodeDir 'node.exe'
$NeedFreeMB = 400            # the app (~100 MB) + room for the books to grow
$RuntimeContact = 'Contact your HC Fashion House administrator.'

function Write-Problem([string]$title, [string[]]$lines) {
  Write-Host ''
  Write-Host "  PROBLEM: $title" -ForegroundColor Red
  foreach ($l in $lines) { Write-Host "    $l" }
}

function Get-Major([string]$exe) {
  try {
    $v = (& $exe -v 2>$null | Out-String).Trim()
    if ($v -match '^v?(\d+)\.') { return [int]$Matches[1] }
  } catch { }
  return 0
}

function Test-WindowsVersion {
  if ([Environment]::OSVersion.Version.Major -ge 10) { return $true }
  Write-Problem 'This version of Windows is too old.' @(
    'HC Fashion House needs Windows 10 or Windows 11.',
    'Node.js, which the app runs on, no longer works on Windows 7 or 8.')
  return $false
}

function Test-AppFolderWritable {
  $probe = Join-Path $PSScriptRoot ".write-test-$([Guid]::NewGuid().ToString('N'))"
  try {
    Set-Content -LiteralPath $probe -Value 'ok' -ErrorAction Stop
    Remove-Item -LiteralPath $probe -Force -ErrorAction SilentlyContinue
    return $true
  } catch {
    Write-Problem 'The app cannot write to its own folder.' @(
      "Folder: $(Split-Path -Parent $PSScriptRoot)",
      'This happens on a read-only drive, or when antivirus',
      '"controlled folder access" blocks it. Allow the HC Fashion House',
      'folder in the antivirus settings, then try again.',
      $RuntimeContact)
    return $false
  }
}

function Test-DiskSpace {
  try {
    $root = [IO.Path]::GetPathRoot($PSScriptRoot)
    $drive = Get-PSDrive -Name $root.Substring(0, 1) -ErrorAction Stop
    $freeMB = [int]($drive.Free / 1MB)
    if ($freeMB -ge $NeedFreeMB) { return $true }
    Write-Problem "Drive $root is almost full." @(
      "It has $freeMB MB free; the app needs about $NeedFreeMB MB.",
      'Free some space (empty the Recycle Bin, delete old downloads) and try again.')
    return $false
  } catch { return $true }   # cannot tell: do not block on it
}

# The Node.js that came with the app, if it is there and starts.
function Get-BundledNode {
  if (-not (Test-Path -LiteralPath $AppNodeExe)) { return $null }
  if ((Get-Major $AppNodeExe) -lt $MinNodeMajor) { return $null }
  return $AppNodeExe
}

# Returns the bundled node.exe (and puts its folder first on PATH), or $null
# after saying what to do. Nothing is fetched to make up for a missing one.
function Use-GoodNode {
  $exe = Get-BundledNode
  if (-not $exe) {
    if (-not (Test-WindowsVersion)) { return $null }
    if (Test-Path -LiteralPath $AppNodeExe) { $what = 'Node.js is in the package but does not start (_system\node\node.exe).' }
    else { $what = 'Node.js (_system\node\node.exe) is not there.' }
    Write-Problem 'Node.js is missing from this package. Reinstall from the HC Fashion House ZIP.' @(
      $what,
      'It comes inside the HC Fashion House ZIP; nothing is downloaded.',
      'If your antivirus removed it, add the HC Fashion House folder to its',
      'exclusions, then install again from a fresh copy of the ZIP.',
      $RuntimeContact)
    return $null
  }
  $env:Path = "$AppNodeDir;$env:Path"
  return $exe
}

# The packages the server needs at run time, as shipped in the ZIP.
function Test-AppPackagesPresent {
  $nm = Join-Path $PSScriptRoot 'node_modules'
  foreach ($p in @('express', 'pdf-lib')) {
    if (-not (Test-Path -LiteralPath (Join-Path $nm "$p\package.json"))) { return $false }
  }
  return $true
}

function Show-PackagesMissing {
  Write-Problem 'App packages are missing. Reinstall from the HC Fashion House ZIP.' @(
    'The _system\node_modules folder is missing or incomplete.',
    'It comes inside the HC Fashion House ZIP; nothing is downloaded.',
    'If your antivirus removed files, add the HC Fashion House folder to its',
    'exclusions, then install again from a fresh copy of the ZIP.',
    'Your invoices are not touched by any of this.',
    $RuntimeContact)
}

# Before installing: the folder and the space.
function Test-InstallReady {
  if (-not (Test-AppFolderWritable)) { return $false }
  if (-not (Test-DiskSpace)) { return $false }
  return $true
}
