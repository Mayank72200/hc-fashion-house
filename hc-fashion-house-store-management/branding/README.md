# HC Fashion House brand artwork

This folder holds the master logo and the facts the icon generator depends on.
Nothing here ships: `branding/` is not under `public/` (so Vite never copies or
precaches it) and the release ZIP does not include it.

## Master

| fact | value |
|---|---|
| file | `branding/hc_icon-master.jpg` (byte-for-byte copy of the logo supplied by the owner) |
| size | 1254 x 1254 px, 287,144 bytes |
| format | JPEG, 24-bit RGB (`Format24bppRgb`), no alpha channel, 72 dpi |
| SHA-256 | `3815b85ce3d3c92d66dfc7472600e391977b50ae2b8adb9698424237159c9361` |
| metadata | EXIF: orientation 1, 72 dpi, sRGB, pixel size only. An empty IPTC block (Photoshop APP13 with its MD5). No author, GPS, camera or software tags. None of it reaches the outputs: every image is drawn into a new bitmap. |
| artwork | round badge: gold ring, HC monogram with swoosh and shoe, "FASHION HOUSE", three lines of fine text (including "SINCE 1994" and "From the House of Hukmichand & Company"); white outside the ring |

## Geometry (master pixels)

| item | value | why |
|---|---|---|
| badge centre | (622.75, 625.50) | minimax centre of the gold ring's outer edge |
| ring outer edge | radius 594.8-604.6 px (mean 599.6), measured every 2 degrees | the ring is not a perfect circle; its band is 20-22 px wide |
| badge cut | follows the measured outer edge, 1.5 px inside it, 1.5 px linear feather | transparency comes from geometry, never from colour: the badge face is near-white (#FCFCFC) and keying white would punch holes in it |
| edge test | walking inwards, the first pixel where red exceeds blue by more than 30 or luminance is below 150, confirmed half a pixel further in; smoothed over 5 samples (8 degrees) | the grey drop shadow under the badge is neutral, so it never counts as ring; the generator stops if any radius falls outside 585-615 px |
| monogram box | x 290-960, y 135-684 (671 x 550) | the monogram's ink and its soft shadow end at y 683; "FASHION HOUSE" starts at y 686 |
| interior cut | circle of radius 568 about the badge centre | keeps the H's top-left serif (radius about 563) and drops the ring and its inner bevel shadow (inner edge from radius about 572) from the box's top corners |
| monogram circle | centre (606.1, 401.1), radius 385.6 | the smallest circle around the ink; it touches the H's left serifs and the swoosh tip under the shoe. The small tier is centred and scaled by it |
| whitening | RGB x 1.035, monogram only | lifts the badge face (about #FBFBF9) to pure white, so the crop has no visible edge on the white disc |

The plan's first estimate was a single circle of radius about 605 at about
(627, 627). Measured, that circle takes in white above the ring at the top
(the outer edge there is at y 30) and the grey shadow below it (the gold ends
at y 1222). Any one circle that stays inside the gold trims the band unevenly
(0 to 10 px of its 21 px), so the cut follows the ring instead. The contact
sheet's last panel draws these lines over the master.

## Colours

| token | value | use |
|---|---|---|
| ring gold (small tier) | #C9A24D | the thin ring around the monogram disc, 32 px and up |
| brand black | #111111 | theme colour (title bar of the installed app) |
| white | #FFFFFF | disc fill; maskable and apple-touch backgrounds |
| gold text on white | #8A6A1F | only if gold text is ever needed on white (about 5:1) |
| sampled from the master | ring #EBC67F, swoosh #D0AE71, centre #120A08, face #FCFCFC | reference only |

The app's own colours and the colours printed on invoices are unchanged.

## Tiers and layout (fractions of the icon size)

- **Small tier** (16, 20, 24, 32, 40, 48, 64, 96 and 128 px): the monogram on a
  white disc 94% wide, transparent outside it. From 32 px a gold ring, 3% wide
  (at least 1 px), sits on the disc's edge and the monogram circle is 82% wide
  (a 3% gap inside the ring). At 16-24 px there is no ring and the monogram
  circle is 92% wide. The disc keeps the black letters visible on dark tab
  strips, taskbars and the dark sidebar.
- **Large tier** (128 px and up): the whole badge, 96% of the icon, with
  transparent corners. Maskable icons put it at 78% on opaque white (inside the
  80% safe zone); the apple-touch icon at 90% on opaque white. The full badge,
  fine text included, is the approved default (Q-09).
- **Resampling**: one GDI+ HighQualityBicubic pass on 32-bit premultiplied ARGB
  with TileFlipXY edges. GDI+ prefilters large reductions; shrinking in halving
  steps measured slightly softer with no gain against aliasing.

## Outputs

| file | tier | sizes (px) | used by | bytes | SHA-256 |
|---|---|---|---|---|---|
| `public/favicon.ico` | small | 16, 32, 48 | browser tab (src/index.html) | 5,372 | `d3b97574ef4be1c7197d2727bbc9ebacc0a6497d9ac979f6fc5665a52b116884` |
| `public/favicon-32.png` | small | 32 | browser tab, manifest | 1,698 | `74b6fb8a30d3adb4abf1bfdae704eb26aced27dd811e7668d8796188c1798101` |
| `public/icons/icon-192.png` | large | 192 | manifest, iOS/Android link, shortcuts | 47,737 | `dc99b77d4777b6b8c2a902cd67cad5425c354196022434608ff3b4520d68e0a4` |
| `public/icons/icon-512.png` | large | 512 | manifest, Android splash | 291,248 | `1493d3e72ce6626e8a9ccd866d819cfcbb29343651eafb16d89e8522217422ef` |
| `public/icons/maskable-192.png` | large, opaque | 192 | manifest (maskable) | 30,849 | `69006c2f880ac35ebea7cfdb581e58dc6fc25c20f8f7466e7d425d4397eb7608` |
| `public/icons/maskable-512.png` | large, opaque | 512 | manifest (maskable) | 184,505 | `ef62a4a432016c6279f75b252e78010d5792b9491bc5b67e49de5a38bfed277d` |
| `public/icons/apple-touch-180.png` | large, opaque | 180 | iOS home screen | 34,935 | `89b053a98e6c56d8b5667698b499cbc6e73575787917de231be865ac4f75cc8e` |
| `public/brand/hc-monogram-64.png` | small | 64 | sidebar logo (40 CSS px), manifest | 4,680 | `655075b52db52b296304d07f4556014d7d90bbaa5ca2fb5551b3b4539595c18a` |
| `public/brand/hc-monogram-128.png` | small | 128 | spare in-app mark | 13,384 | `9bda983c5faf043f50220d03455aec959c12cd9b84be16d754056b20828904e0` |
| `public/brand/hc-badge-256.png` | large | 256 | About, lock screen, welcome, server-down screen | 80,558 | `555fa1079d2993c921f8d5eef2d1bd41fa9153d232604af10562b2e63126f022` |
| `public/brand/hc-badge-512.png` | large | 512 | spare in-app badge (same image as icon-512.png) | 291,248 | `1493d3e72ce6626e8a9ccd866d819cfcbb29343651eafb16d89e8522217422ef` |
| `release-templates/_system-scripts/app-icon.ico` | small 16-96, large 128-256 | 16, 20, 24, 32, 40, 48, 64, 96, 128, 256 | launcher window and taskbar, Desktop and Start Menu shortcuts, folder icon | 126,815 | `c0ea44000b3483fe2a42a80d43d8dd1584e8633fed8abe0c031387b4aae6a654` |

Every PNG keeps only its IHDR, IDAT and IEND chunks. Transparent files are
RGBA with fully transparent corners; the maskable and apple-touch files are
RGB (no alpha at all). Every ICO entry is stored as PNG data behind a standard
ICONDIR / ICONDIRENTRY header (Windows Vista and later, every current
browser). Checked on Windows 11: the Win32 icon loader (what Explorer
shortcuts and the launcher's window icon use) and WIC decode every frame of
both ICO files. The launcher's 64 px `<img>` runs on the IE11 engine, which
always picks the 16 px frame of an ICO; a sharper mark there would point at a
PNG instead (in the release: `_system\dist\brand\hc-monogram-128.png`).

## Regenerating

```
npm run icons
```

which runs `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-icons.ps1`
(Windows PowerShell 5.1 and System.Drawing only; nothing to install or download).
Options: `-Source <master>` (default this folder's JPG), `-RepoRoot <app folder>`
(default the folder above `scripts/`) and `-ContactSheet <png>`, which also draws
every output at actual size on light and dark backgrounds, a 4x zoom of the
small frames, the sidebar, the maskable safe zone and the geometry overlay.
Keep the contact sheet outside the repo.

The script stops before writing anything if the master is not 1254 x 1254
`Format24bppRgb`, or if the ring edge is not where the geometry expects it. It
re-reads every file it wrote (sizes, chunks, corner alpha, ICO directory) and
prints the SHA-256 of each. The same master always gives the same bytes, so the
hashes above change only when the artwork or the generator does.

To use a different master: measure it again, update the constants at the top
of `scripts/generate-icons.ps1` and the geometry table above, review a contact
sheet, then update the hashes above.

A Windows PC that showed an older icon at the same `app-icon.ico` path may keep
it cached: run `ie4uinit.exe -show`, re-create the shortcuts and hard-reload
the browser for the favicon. A PC that never had the app needs nothing.
