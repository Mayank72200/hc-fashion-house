# HC Fashion House

Store billing, stock and GST management for HC Fashion House.

The app runs entirely on the shop's Windows PC. A small local server keeps
the books in files on this PC, and the screens open in the browser at
<http://localhost:47371>. It needs no internet connection and no account.

Contact your HC Fashion House administrator.

- For staff: start, stop, back up, restore, move to another PC
- For the administrator: install, where the data lives, new versions,
  security, Google Drive
- For maintainers: build and test

## For staff

### Start

- Double-click the **HC Fashion House** shortcut on the Desktop or in the
  Start Menu, then click **Open App**. The app starts and opens in the
  browser.
- Closed the browser tab? Use the shortcut and Open App again, or open
  <http://localhost:47371> in Edge.
- Always use that exact address (not 127.0.0.1): settings kept in the
  browser belong to it.

### Stop

- In the app: **Control Panel -> Stop Server**, or open the launcher (the
  same shortcut) and choose **More options -> Stop the app**. Shutting down
  Windows also stops the app.

### Back up (every day)

- The app keeps its own daily snapshot of the books for the last 30 days
  (Settings -> Backups).
- **Control Panel -> Create Backup** saves a ZIP of the books in the
  `Backups` folder of the install (**Open Backups Folder** shows it).
- **Settings -> Import/Export -> Export Backup** downloads one file,
  `hc-fashion-house-backup-<date>.json`, to the browser's Downloads folder.
- Copy a recent backup to a USB drive regularly and keep the drive away
  from the PC. Never keep backups in OneDrive or another synced folder:
  they hold the whole books.

### Restore

- **From a backup file** (Settings -> Import/Export -> Import): by default
  this only adds records that are missing on this PC. Tick
  **Replace existing data** to let the backup overwrite matching records.
  The app first takes a snapshot of the current books, never lowers an
  invoice-number counter and keeps this PC's PIN. The message afterwards
  shows how many records were written and how many were skipped.
- **From a backup ZIP** (Control Panel -> Choose Backup ZIP, or the
  launcher's More options -> Restore a backup): pick the ZIP and check the
  numbers it shows. The current data is saved first as
  `pre-restore-<date>.zip` in the `Backups` folder. The app closes while
  the backup is restored; open it again when the restore window says Done.
- **From a daily snapshot**: Settings -> Backups, pick the date, Restore.

### Move to another PC

**Control Panel -> Export for Move** writes a ZIP into the `Backups`
folder. Install HC Fashion House on the new PC, then use
**Control Panel -> Choose Backup ZIP** there.

### What leaves this computer

Nothing, unless you ask for it:

- **Google Drive** (only if the administrator has turned it on): an
  invoice is uploaded only when you click **Save to Drive**, and a backup
  only when you tick the Google Drive box while exporting it. Both go to
  the shop's own Google account. A Drive backup holds the whole books.
- **WhatsApp and e-mail** hand the invoice to the WhatsApp or mail app on
  this PC; you send it from there.
- Links to government portals (GST, TDS) open in the browser only when
  you click them.

The app never checks for updates and loads no fonts, images or scripts
from the internet.

## For the administrator

### Install on the shop PC

1. Copy `HC-Fashion-House-v<version>.zip` to the PC and extract it
   (right-click -> Extract All).
2. Double-click **HC Fashion House - WINDOWS.hta** in the extracted folder
   and click **Install**. Install copies the app to
   `%LOCALAPPDATA%\Programs\HC Fashion House` (on this PC only, never a
   synced folder), creates **HC Fashion House** shortcuts on the Desktop
   and in the Start Menu, and opens the app. The extracted folder is not
   needed afterwards.
3. Windows may warn that the launcher is not signed: More info -> Run
   anyway.
4. If the launcher says the app is already installed on this computer,
   keep using that copy; do not install a second one.

Everything the app needs is inside the ZIP, including its own Node.js,
so installing needs no internet connection. Optional: in Edge, use the
install icon in the address bar to give the app a window of its own.

### First-time setup (in the app)

1. **Settings -> Company Details**: the shop's name, address, GSTIN and
   bank / UPI details, then **Save Profile**.
2. **Settings -> Invoice Number Format**: set the brand prefix (for
   example `HC`) before the first invoice.
3. **Settings -> Terms**: under Quick Start click
   **HC Fashion House Store Terms**, then edit the new template and replace
   `<city>` with the shop's city before using it on invoices.
4. A new invoice fills in the **first** saved terms template, and thermal
   receipts print the invoice's terms too. On a new install the first
   template is the built-in "Standard Terms" (written for service
   businesses). Delete "Standard Terms" (it is not created again), or pick
   the shop's terms on each invoice. To leave the terms off one receipt,
   untick Customize -> Terms & Conditions on that invoice.

### Where the data lives

Inside the install folder (`_system` is hidden; in File Explorer use
View -> Show -> Hidden items):

- `_system\data`: the books (invoices, clients, products, settings) as
  JSON files, with the daily snapshots in `_system\data\backups`.
- `_system\Saved Invoices`: saved invoice PDFs. `_system\Trash`: deleted
  invoice PDFs, kept for 30 days.
- `_system\logs`: `egress-guard.log` (outside connections the server
  blocked) and `csp.log` (outside requests a page tried). Both normally
  stay empty; anything in them is worth a look.
- `Backups` (next to the launcher): Create Backup and Export for Move
  ZIPs.

Never delete or overwrite `_system\data`, `_system\Saved Invoices`,
`_system\Trash` or `Backups`.

### Install a new version

The app never updates itself. To install a new HC Fashion House build
(the same steps as "FOR THE ADMINISTRATOR" in READ ME FIRST):

1. Back up: launcher **More options -> Back up my data** (or **Control
   Panel -> Create Backup**), and **Settings -> Import/Export -> Export
   Backup**. Copy the newest backup ZIP and the backup file to a USB
   drive.
2. Launcher **More options -> Uninstall (keeps your books)**. Only the
   program and its shortcuts are removed; `_system\data`,
   `_system\Saved Invoices`, `_system\Trash`, `_system\logs` and the
   `Backups` folder stay.
3. Extract the new ZIP, open its launcher and click **Install**. It finds
   the books in the program folder and keeps using them.
4. Open the app and check the version under About.

If the books do not look right afterwards, restore the backup ZIP from
step 1 (launcher **More options -> Restore a backup**).

### Security notes

- The server listens only on this PC (127.0.0.1) and answers only
  requests for its own address and port. Never expose it to the network
  (no port forwarding, tunnel or reverse proxy): it has no user accounts,
  and the PIN only locks the screen.
- Use Edge with a separate profile for the app, and turn off sync,
  cloud spell-check (Editor) and translation in that profile, so typed
  customer details are not sent to an online service.
- Optional, with administrator rights: a Windows Firewall rule that stops
  the app's own Node.js from reaching the internet. The app talks only to
  this PC, so it keeps working. In an elevated PowerShell:

      New-NetFirewallRule -DisplayName "HC Fashion House - block app Node outbound" -Direction Outbound -Action Block -Program "$env:LOCALAPPDATA\Programs\HC Fashion House\_system\node\node.exe" -Profile Any

  Use the real install folder in `-Program` if it differs. On a
  domain-joined PC, check that local rules apply:
  `Get-NetFirewallProfile -PolicyStore ActiveStore | Select Name, AllowLocalFirewallRules`.
  Remove the rule with
  `Remove-NetFirewallRule -DisplayName "HC Fashion House - block app Node outbound"`
  before removing the app.

### Google Drive (optional, off by default)

To let staff save invoices and backups to the shop's own Google account:

1. In Google Cloud Console (<https://console.cloud.google.com/>) create a
   project, enable the **Google Drive API** and create an **OAuth client
   ID** of type Web application.
2. Add `http://localhost:47371` as an authorised JavaScript origin.
3. In the app: **Settings -> Features**, turn on
   **Google Drive (Save to Drive)**. Then in **Settings -> Google Drive**
   paste the Client ID and click **Connect Google Drive**.

Invoices then show a **Save to Drive** button, and Export Backup a Google
Drive tick box. Files go to the "HC Fashion House Invoices" folder
(backups to "HC Fashion House Invoices - Backups"). Backup files never
carry the Client ID, and importing a backup never turns Drive on.

## For maintainers: build and test

Work only in a copy of the repository outside OneDrive (for example
`C:\dev\hcfh`) with demo data. Never run the app, the tests or a build
against the shop's live data.

Needs Windows and Node.js 24 LTS. The only online step, once per build
machine: `npm ci` (installs exactly the packages pinned in
`package-lock.json`) and `npm run test:install` (the Firefox build that
the smoke test drives). After that everything runs offline.

- `npm run dev`: the local server plus the Vite dev server. To keep its
  data out of the working copy, create a test folder and point
  `HCFH_HOME` at it first.
- `npm run lint`
- `npm run test:unit`: the tax, discount and CSV suites (all three run;
  any failure fails the command).
- `npm test`: the unit suites plus the browser smoke test, which runs the
  server on a temporary data folder. The smoke test drives Firefox; set
  `SMOKE_BROWSER=msedge` to run it in the installed Microsoft Edge
  instead (for a machine where Playwright's Firefox cannot be installed).
- `npm run guard`: brand-guard. Fails on any trace of the original
  product, any outside address not on its allow-list and any download
  command in a shipped script. `npm run guard:dist` checks the built
  `dist/` the same way.
- `npm run build`: builds `dist/`. It first copies the OCR files and
  checks the pinned English language data in `vendor/tessdata`.
- `npm run release:zip`: guard, lint, unit tests, build, guard on
  `dist/`, the release ZIP, then its offline verification (extract, start
  with the bundled Node.js, smoke test, empty security logs). Output:
  `release-build/HC-Fashion-House-v<version>.zip`.

Before the first release build, add the Node.js runtime: download the
Windows x64 ZIP of a Node.js 24 LTS release (`node-v<version>-win-x64.zip`)
and the `SHASUMS256.txt` of the same release from the official Node.js
website, check the hash, copy the ZIP to `vendor/node/` (not committed),
and set `NODE_VERSION` and `NODE_ZIP_SHA256` at the top of
`scripts/build-release-zip.mjs`. The build refuses any other file.

The version number lives in `package.json` and shows under About.
Licences: `LICENSE`, and `licenses/THIRD-PARTY-NOTICES.txt` (release
builds add the licence of every package they ship).
