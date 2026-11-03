# HC Fashion House - Windows installer.
#
# Invoked by the HTA launcher's Install button. Idempotent - safe to re-run
# any time.
#   1. Copies the app to this PC's program folder,
#      %LOCALAPPDATA%\Programs\HC Fashion House, unless it already runs from
#      there. That folder is on this PC only - never OneDrive, the Desktop or
#      Documents, which many PCs copy to the cloud. Books already in it (from
#      an earlier install) are never overwritten; the app keeps using them.
#   2. Checks the Node.js and app packages that come inside the ZIP. Nothing
#      is downloaded and nothing is installed into Windows.
#   3. Creates the Desktop and Start Menu shortcuts pointing at the HTA
#      launcher, hides _system, gives the folder the app icon, and writes
#      _system\hcfh-installed.json, which marks the copy as installed.
#   4. Starts the app.

$ErrorActionPreference = 'Continue'

$helper = Join-Path $PSScriptRoot 'hcfh-paths.ps1'
if (-not (Test-Path -LiteralPath $helper)) {
  Write-Host '  Missing file: hcfh-paths.ps1. Reinstall from the HC Fashion House ZIP.' -ForegroundColor Red
  if ($env:HCFH_NONINTERACTIVE -ne '1') { Read-Host '  Press Enter to close' }
  exit 1
}
. $helper
Set-HcfhTitle 'HC Fashion House - Installer'

$SystemDir   = $HcfhSystemDir
$RootDir     = $HcfhInstallRoot
$LauncherHTA = Join-Path $RootDir $HcfhLauncherName

Write-Host ''
Write-Host '  ============================================================'
Write-Host '   HC Fashion House - Installer'
Write-Host '  ============================================================'
Write-Host ''

if (-not (Test-HcfhReleaseLayout)) {
  Wait-HcfhEnter
  exit 1
}
if ($env:HCFH_HOME) {
  Write-Host "  Note: HCFH_HOME is set, so the app will keep its books in $($env:HCFH_HOME)." -ForegroundColor Yellow
}

# Never make a second copy by accident. Every new ZIP extracts to a new
# folder, and installing there made a second, empty app and moved the
# shortcuts to it, so the invoices seemed gone. The shortcuts point at the
# real install; if that is another folder with the app in it, stop.
$other = Find-HcfhOtherInstall -Exclude $RootDir
if ($other) {
  Write-Host '  HC Fashion House is already installed on this computer, in:' -ForegroundColor Yellow
  Write-Host "    $other"
  Write-Host ''
  Write-Host '  Installing again would make a second copy with no invoices in it.'
  Write-Host '  Keep using the installed copy from its shortcut.'
  Write-Host '  To install a new version over it: back up, uninstall the installed copy'
  Write-Host '  (its launcher -> More options -> Uninstall; the books are kept), then'
  Write-Host '  click Install here. READ ME FIRST explains it step by step.'
  Write-Host ''
  Write-Host '  Nothing was changed.'
  Wait-HcfhEnter
  exit 0
}

# The program folder must stay on this PC.
if (-not $HcfhProductRoot) {
  Write-Host '  This Windows account has no local app data folder (LOCALAPPDATA), so' -ForegroundColor Red
  Write-Host "  there is nowhere to install to. Nothing was installed. $HcfhContactLine" -ForegroundColor Red
  Wait-HcfhEnter
  exit 1
}
if (Test-HcfhSyncedPath $HcfhProductRoot) {
  Write-Host "  The program folder $HcfhProductRoot is inside a folder that syncs" -ForegroundColor Red
  Write-Host "  to the cloud, so nothing was installed. $HcfhContactLine" -ForegroundColor Red
  Wait-HcfhEnter
  exit 1
}

# --- Step 1: the runtime that came in the ZIP ---
# Checked before anything is copied: a half-extracted ZIP is refused here.
. (Join-Path $SystemDir 'ensure-node.ps1')
if (-not (Test-WindowsVersion)) {
  Wait-HcfhEnter
  exit 1
}
if (-not (Use-GoodNode)) {
  Wait-HcfhEnter
  exit 1
}
if (-not (Test-AppPackagesPresent)) {
  Show-PackagesMissing
  Wait-HcfhEnter
  exit 1
}

# --- Step 2: copy the app to the program folder ---
if (-not (Test-HcfhSamePath $RootDir $HcfhProductRoot)) {
  $target = $HcfhProductRoot
  Write-Host "  Copying the app to $target ..."
  if (Test-HcfhSyncedPath $RootDir) {
    Write-Host '  (This folder syncs to the cloud, so the app is not installed here.)'
  }
  $kept = Get-HcfhInvoiceCount (Join-Path $target '_system\data')
  if ($kept -gt 0) { Write-Host "  Found $kept invoices there from an earlier install. They are kept." }
  try {
    New-Item -ItemType Directory -Path (Join-Path $target '_system\data') -Force -ErrorAction Stop | Out-Null
    # The launcher files beside _system (never a desktop.ini or a RESET-PIN file).
    foreach ($f in @(Get-ChildItem -LiteralPath $RootDir -File -Force -ErrorAction Stop)) {
      if ($f.Name -eq 'desktop.ini' -or $f.Name -like 'RESET-PIN*') { continue }
      Copy-Item -LiteralPath $f.FullName -Destination (Join-Path $target $f.Name) -Force -ErrorAction Stop
    }
    # The program files. This folder's own data, Saved Invoices, Trash and
    # logs stay behind, so books already in the program folder are never
    # overwritten. /E adds and replaces files only; it never deletes any.
    $src = $SystemDir
    $dst = Join-Path $target '_system'
    & robocopy.exe $src $dst /E /R:2 /W:2 /NP /NFL /NDL /NJH /NJS `
      /XD (Join-Path $src 'data') (Join-Path $src 'Saved Invoices') (Join-Path $src 'Trash') (Join-Path $src 'logs') `
      /XF $HcfhInstallMarker
    if ($LASTEXITCODE -ge 8) { throw "copying the program files failed (robocopy code $LASTEXITCODE)" }
  } catch {
    Write-Host ''
    Write-Host "  PROBLEM: the app could not be copied: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host '  If HC Fashion House is running, stop it, then try again.'
    Write-Host "  $HcfhContactLine"
    Wait-HcfhEnter
    exit 1
  }
  foreach ($n in @($HcfhLauncherName, '_system\server.js', '_system\package.json', '_system\hcfh-paths.ps1',
                   '_system\install-windows.ps1', '_system\node\node.exe', '_system\node_modules\express\package.json')) {
    if (-not (Test-Path -LiteralPath (Join-Path $target $n))) {
      Write-Host "  PROBLEM: $n did not arrive in $target." -ForegroundColor Red
      Write-Host "  $HcfhContactLine"
      Wait-HcfhEnter
      exit 1
    }
  }
  # Carry on from the copy, so everything below points at the program folder.
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $target '_system\install-windows.ps1')
  exit $LASTEXITCODE
}

# --- Step 3: room to work ---
if (-not (Test-InstallReady)) {
  Wait-HcfhEnter
  exit 1
}
if (-not (Test-Path -LiteralPath $HcfhBackupsDir)) { New-Item -ItemType Directory -Path $HcfhBackupsDir -Force | Out-Null }

# --- Step 4: Desktop shortcut ---
Write-Host ''
Write-Host '  Creating Desktop shortcut...'
$mshta = Join-Path $env:SystemRoot 'System32\mshta.exe'
if (-not (Test-Path -LiteralPath $mshta)) { $mshta = 'mshta.exe' }
$iconPath = Join-Path $SystemDir 'app-icon.ico'
try {
  $desktop = [Environment]::GetFolderPath('Desktop')
  $shortcutPath = Join-Path $desktop $HcfhShortcutName
  $wsh = New-Object -ComObject WScript.Shell
  $sc = $wsh.CreateShortcut($shortcutPath)
  # Point the shortcut at mshta.exe with the HTA as its argument.
  # This way double-clicking the shortcut always opens the launcher
  # even if the user later associates .hta with something else.
  $sc.TargetPath = $mshta
  $sc.Arguments = "`"$LauncherHTA`""
  $sc.WorkingDirectory = $RootDir
  if (Test-Path -LiteralPath $iconPath) { $sc.IconLocation = $iconPath }
  $sc.Description = 'HC Fashion House - open the launcher'
  $sc.Save()
  Write-Host "  Desktop shortcut created: $shortcutPath"
} catch {
  Write-Host "  WARNING: could not create Desktop shortcut ($($_.Exception.Message)). You can still open the launcher in $RootDir."
}

# --- Step 5: Start Menu shortcut (Programs list) ---
try {
  $startMenu = Join-Path ([Environment]::GetFolderPath('Programs')) $HcfhShortcutName
  $wsh = New-Object -ComObject WScript.Shell
  $sc = $wsh.CreateShortcut($startMenu)
  $sc.TargetPath = $mshta
  $sc.Arguments = "`"$LauncherHTA`""
  $sc.WorkingDirectory = $RootDir
  if (Test-Path -LiteralPath $iconPath) { $sc.IconLocation = $iconPath }
  $sc.Description = 'HC Fashion House'
  $sc.Save()
} catch { }

# --- Step 6: Hide _system folder so root looks clean ---
try {
  attrib +H "$SystemDir" 2>$null
} catch { }

# --- Step 7: give the app folder our icon ---
# Windows will not let a .hta file carry its own icon - a file gets whatever
# its TYPE is registered with, and only .exe, .ico, .lnk and folders can say
# otherwise. A folder can, through desktop.ini, and only when the folder
# itself is marked read-only or system. So the one icon we are allowed to
# set here, we set: the install folder stops looking like a nameless yellow
# folder full of files Windows has no idea about.
try {
  if (Test-Path -LiteralPath $iconPath) {
    $ini = Join-Path $RootDir 'desktop.ini'
    $lines = @(
      '[.ShellClassInfo]',
      'IconResource=_system\app-icon.ico,0',
      'InfoTip=HC Fashion House - open the launcher inside'
    )
    if (Test-Path -LiteralPath $ini) { attrib -H -S "$ini" 2>$null }
    Set-Content -LiteralPath $ini -Value $lines -Encoding ASCII -Force
    attrib +H +S "$ini" 2>$null
    # The folder needs one of these bits before the shell reads desktop.ini.
    # +R on a folder is only this marker; it does not make anything inside
    # read-only.
    attrib +R "$RootDir" 2>$null
  }
} catch { }

# --- Step 8: mark this copy as installed ---
# The launcher shows "Open App" and start-windows.ps1 starts the server only
# once this file exists, so it is written last.
try {
  $version = ''
  $pkgText = Get-Content -LiteralPath (Join-Path $SystemDir 'package.json') -Raw -ErrorAction Stop
  if ($pkgText -match '"version"\s*:\s*"([^"]+)"') { $version = $Matches[1] }
  $marker = @(
    '{',
    '  "product": "HC Fashion House",',
    ('  "version": "' + $version + '",'),
    ('  "installedAt": "' + (Get-Date).ToUniversalTime().ToString('o') + '"'),
    '}'
  )
  Set-Content -LiteralPath $HcfhInstallMarker -Value $marker -Encoding ASCII -Force -ErrorAction Stop
} catch {
  Write-Host ''
  Write-Host "  PROBLEM: the install could not be finished ($($_.Exception.Message))." -ForegroundColor Red
  Write-Host "  Click Install again. $HcfhContactLine"
  Wait-HcfhEnter
  exit 1
}
# A note left by an earlier uninstall no longer applies.
Remove-Item -LiteralPath (Join-Path $RootDir 'HC Fashion House was removed - READ ME.txt') -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host '  ============================================================'
Write-Host '   [OK] Install complete!' -ForegroundColor Green
Write-Host '  ============================================================'
Write-Host ''
Write-Host "  Installed in: $RootDir"
Write-Host '  Opening the app in your browser now...'
Write-Host ''
Write-Host '  Next time, use the HC Fashion House shortcut on your Desktop.'
Write-Host ''

# Finish the job. Leaving a console window saying "now go and click Open
# App" is one step too many for someone who has never installed anything
# but an .exe: they saw a black window, it said OK, and nothing happened.
# Start the server and open the browser ourselves.
$starter = Join-Path $SystemDir 'start-windows.ps1'
if (Test-Path -LiteralPath $starter) {
  & $starter
  exit $LASTEXITCODE
} else {
  Write-Host '  Could not find start-windows.ps1 - open the launcher and click Open App.'
  Wait-HcfhEnter
  exit 1
}
