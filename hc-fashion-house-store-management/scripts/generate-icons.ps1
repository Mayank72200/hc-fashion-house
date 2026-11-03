<#
  generate-icons.ps1 - rebuilds every HC Fashion House icon from the master logo.

  Development tool; it is not shipped. Windows PowerShell 5.1 and System.Drawing
  only: nothing to install, nothing downloaded, nothing run from elsewhere.

    npm run icons
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts\generate-icons.ps1
        [-Source <master.jpg>] [-RepoRoot <app folder>] [-ContactSheet <preview.png>]

  -Source        the master logo; default branding\hc_icon-master.jpg
  -RepoRoot      the app folder; default the folder above this script
  -ContactSheet  optional: also draw every output on light and dark backgrounds
                 into this PNG (keep it outside the repo)

  Two tiers (geometry, measurements and reasons: branding\README.md):
    small  16-128 px   the HC monogram cut from the badge, centred on a white
                       disc, with a thin gold ring from 32 px up
    large  128 px up   the whole badge, cut out along the outer edge of its
                       gold ring, so the corners are transparent
  Every image is drawn into a new bitmap, so nothing from the JPEG's metadata
  is carried over, and every PNG keeps only its IHDR, IDAT and IEND chunks.
#>
[CmdletBinding()]
param(
  [string]$Source,
  [string]$RepoRoot,
  [string]$ContactSheet
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0
Add-Type -AssemblyName System.Drawing

# ---- Geometry of the 1254 x 1254 master (pixels; see branding\README.md) ----
$MasterSize = 1254
$BadgeCx = 622.75; $BadgeCy = 625.50   # centre of the gold ring's outer edge
$EdgeLow = 585.0; $EdgeHigh = 615.0    # the measured edge must fall in here
$EdgeInset = 1.5                       # cut this far inside the gold edge
$Feather = 1.5                         # width of the alpha ramp at the cut
$MonoBox = @{ X = 290; Y = 135; W = 671; H = 550 }   # x 290-960, y 135-684
$MonoCutR = 568.0                      # about the badge centre: keeps the H, drops the ring
$MonoCx = 606.1; $MonoCy = 401.1; $MonoR = 385.6     # smallest circle around the monogram
$Whiten = 1.035                        # lifts the off-white badge face to pure white

# ---- Small-tier layout, as fractions of the icon size ----
$SmallDisc = 0.94      # white disc diameter
$SmallRing = 0.03      # gold ring stroke (at least 1 px), from 32 px up
$SmallGapRing = 0.03   # space between the monogram and the ring
$SmallGapPlain = 0.01  # space to the disc edge when there is no ring (16-24 px)
$RingFrom = 32
$Gold = [System.Drawing.Color]::FromArgb(255, 0xC9, 0xA2, 0x4D)   # #C9A24D

# ---- Large-tier badge diameter, as a fraction of the icon size ----
$FillAny = 0.96        # transparent icons and in-app images
$FillMaskable = 0.78   # inside the 80% safe zone, on white
$FillApple = 0.90      # iOS home screen, on white

$PF = [System.Drawing.Imaging.PixelFormat]

function New-Canvas([int]$w, [int]$h) {
  return New-Object System.Drawing.Bitmap($w, $h, $PF::Format32bppPArgb)
}

function New-Gfx($bmp) {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  return $g
}

function New-RectF([double]$x, [double]$y, [double]$w, [double]$h) {
  return New-Object System.Drawing.RectangleF([single]$x, [single]$y, [single]$w, [single]$h)
}

# Draws the source rectangle of $img onto $g at the destination rectangle, in
# one HighQualityBicubic pass: GDI+ prefilters large reductions itself, and
# shrinking in halving steps measured slightly softer with no gain against
# aliasing. TileFlipXY stops the edges fading into the transparent outside.
function Copy-ImageRegion($g, $img, [double]$sx, [double]$sy, [double]$sw, [double]$sh,
                     [double]$dx, [double]$dy, [double]$dw, [double]$dh) {
  $attr = New-Object System.Drawing.Imaging.ImageAttributes
  try {
    $attr.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $pts = [System.Drawing.PointF[]]@(
      (New-Object System.Drawing.PointF([single]$dx, [single]$dy)),
      (New-Object System.Drawing.PointF([single]($dx + $dw), [single]$dy)),
      (New-Object System.Drawing.PointF([single]$dx, [single]($dy + $dh))))
    $g.DrawImage($img, $pts, (New-RectF $sx $sy $sw $sh), [System.Drawing.GraphicsUnit]::Pixel, $attr)
  } finally { $attr.Dispose() }
}

# Outer edge of the gold ring every 2 degrees about the badge centre: walking
# inwards from the canvas edge, the first pixel that is gold (red well above
# blue) or dark, confirmed half a pixel further in. The neutral grey shadow
# under the badge does not count. Smoothed over 5 samples.
function Get-RingEdge([byte[]]$px, [int]$stride, [int]$w, [int]$h) {
  $n = 180
  $raw = New-Object double[] $n
  for ($i = 0; $i -lt $n; $i++) {
    $t = $i * [Math]::PI / 90.0
    $ux = [Math]::Cos($t); $uy = [Math]::Sin($t)
    $found = 0.0
    for ($r = 626.0; $r -gt 560.0; $r -= 0.25) {
      $x = [int][Math]::Floor($BadgeCx + $r * $ux); $y = [int][Math]::Floor($BadgeCy + $r * $uy)
      if ($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h) { continue }
      $k = $y * $stride + 4 * $x
      $b = [int]$px[$k]; $gg = [int]$px[$k + 1]; $rr = [int]$px[$k + 2]
      if ((($rr - $b) -gt 30) -or ((0.299 * $rr + 0.587 * $gg + 0.114 * $b) -lt 150)) {
        $x2 = [int][Math]::Floor($BadgeCx + ($r - 0.5) * $ux); $y2 = [int][Math]::Floor($BadgeCy + ($r - 0.5) * $uy)
        $k2 = $y2 * $stride + 4 * $x2
        $b2 = [int]$px[$k2]; $g2 = [int]$px[$k2 + 1]; $r2 = [int]$px[$k2 + 2]
        if ((($r2 - $b2) -gt 30) -or ((0.299 * $r2 + 0.587 * $g2 + 0.114 * $b2) -lt 150)) { $found = $r; break }
      }
    }
    if ($found -eq 0.0) { throw "No gold ring edge found at $($i * 2) degrees. Is this the HC master?" }
    $raw[$i] = $found
  }
  $edge = New-Object double[] $n
  for ($i = 0; $i -lt $n; $i++) {
    $s = 0.0
    for ($j = -2; $j -le 2; $j++) { $s += $raw[($i + $j + $n) % $n] }
    $edge[$i] = $s / 5.0
  }
  $min = ($edge | Measure-Object -Minimum).Minimum; $max = ($edge | Measure-Object -Maximum).Maximum
  if ($min -lt $EdgeLow -or $max -gt $EdgeHigh) {
    throw ("Gold ring edge at radius {0:N1}-{1:N1} px, expected {2}-{3}. Re-measure the geometry (branding\README.md)." -f $min, $max, $EdgeLow, $EdgeHigh)
  }
  return ,$edge
}

# The badge with transparent corners: alpha follows the measured ring edge,
# pulled in by $EdgeInset, with a linear ramp $Feather wide. Geometry only;
# nothing is keyed on colour (the badge face is near-white too).
function New-BadgeCutout($master) {
  $w = $master.Width; $h = $master.Height
  $bmp = New-Object System.Drawing.Bitmap($w, $h, $PF::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.DrawImage($master, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)))
  $g.Dispose()
  $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, $PF::Format32bppArgb)
  try {
    $stride = $data.Stride
    $px = New-Object byte[] ($stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $px, 0, $px.Length)
    $edge = Get-RingEdge $px $stride $w $h
    $min = ($edge | Measure-Object -Minimum).Minimum; $max = ($edge | Measure-Object -Maximum).Maximum
    $half = $Feather / 2
    $rIn = $min - $EdgeInset - $half - 1     # fully opaque inside this
    $rOut = $max - $EdgeInset + $half + 1    # fully transparent outside this
    for ($y = 0; $y -lt $h; $y++) {
      $dy = $y + 0.5 - $BadgeCy
      $row = $y * $stride
      $ady = [Math]::Abs($dy)
      if ($ady -ge $rOut) { [Array]::Clear($px, $row, 4 * $w); continue }
      $xo = [Math]::Sqrt($rOut * $rOut - $dy * $dy)
      $xl = [Math]::Max(0, [int][Math]::Floor($BadgeCx - $xo))
      $xr = [Math]::Min($w - 1, [int][Math]::Ceiling($BadgeCx + $xo))
      if ($xl -gt 0) { [Array]::Clear($px, $row, 4 * $xl) }
      if ($xr -lt $w - 1) { [Array]::Clear($px, $row + 4 * ($xr + 1), 4 * ($w - 1 - $xr)) }
      $skipFrom = $w; $skipTo = -1
      if ($ady -lt $rIn) {
        $xi = [Math]::Sqrt($rIn * $rIn - $dy * $dy)
        $skipFrom = [int][Math]::Ceiling($BadgeCx - $xi); $skipTo = [int][Math]::Floor($BadgeCx + $xi)
      }
      $x = $xl
      while ($x -le $xr) {
        if ($x -ge $skipFrom -and $x -le $skipTo) { $x = $skipTo + 1; continue }
        $dx = $x + 0.5 - $BadgeCx
        $d = [Math]::Sqrt($dx * $dx + $dy * $dy)
        $deg = [Math]::Atan2($dy, $dx) * 180.0 / [Math]::PI
        if ($deg -lt 0) { $deg += 360.0 }
        $f = $deg / 2.0
        $fl = [Math]::Floor($f)
        $i0 = ([int]$fl) % 180
        $fr = $f - $fl
        $re = $edge[$i0] * (1 - $fr) + $edge[($i0 + 1) % 180] * $fr - $EdgeInset
        $a = ($re + $half - $d) / $Feather
        $k = $row + 4 * $x
        if ($a -le 0) { $px[$k] = 0; $px[$k + 1] = 0; $px[$k + 2] = 0; $px[$k + 3] = 0 }
        elseif ($a -lt 1) { $px[$k + 3] = [byte][Math]::Round(255 * $a) }
        $x++
      }
    }
    [System.Runtime.InteropServices.Marshal]::Copy($px, 0, $data.Scan0, $px.Length)
  } finally { $bmp.UnlockBits($data) }
  $premul = $bmp.Clone($rect, $PF::Format32bppPArgb)
  $bmp.Dispose()
  return @{ Bitmap = $premul; Edge = $edge; Radius = ($max - $EdgeInset + $half) }
}

# A white square centred on the monogram's circle, holding the crop box
# clipped to the badge interior (so no part of the ring comes along), with
# the off-white face lifted to white. 1000 px covers the widest tile.
function New-MonogramSource($master) {
  $w = $master.Width; $h = $master.Height
  $white = New-Object System.Drawing.Bitmap($w, $h, $PF::Format32bppArgb)
  $cm = New-Object System.Drawing.Imaging.ColorMatrix
  $cm.Matrix00 = [single]$Whiten; $cm.Matrix11 = [single]$Whiten; $cm.Matrix22 = [single]$Whiten
  $ia = New-Object System.Drawing.Imaging.ImageAttributes
  $ia.SetColorMatrix($cm)
  $g = [System.Drawing.Graphics]::FromImage($white)
  $g.DrawImage($master, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)), 0, 0, $w, $h, [System.Drawing.GraphicsUnit]::Pixel, $ia)
  $g.Dispose(); $ia.Dispose()

  $side = 1000
  $ox = [int][Math]::Round($MonoCx) - $side / 2
  $oy = [int][Math]::Round($MonoCy) - $side / 2
  $src = New-Canvas $side $side
  $g = New-Gfx $src
  $g.Clear([System.Drawing.Color]::White)
  $g.SetClip((New-Object System.Drawing.Rectangle(($MonoBox.X - $ox), ($MonoBox.Y - $oy), $MonoBox.W, $MonoBox.H)))
  $tb = New-Object System.Drawing.TextureBrush($white)
  $tb.TranslateTransform([single](-$ox), [single](-$oy))
  $g.FillEllipse($tb, (New-RectF ($BadgeCx - $MonoCutR - $ox) ($BadgeCy - $MonoCutR - $oy) (2 * $MonoCutR) (2 * $MonoCutR)))
  $tb.Dispose(); $g.Dispose(); $white.Dispose()
  return @{ Bitmap = $src; Cx = ($MonoCx - $ox); Cy = ($MonoCy - $oy) }
}

function New-SmallIcon($mono, [int]$size) {
  $ring = $size -ge $RingFrom
  $discR = $SmallDisc * $size / 2
  $ringW = 0.0
  if ($ring) { $ringW = [Math]::Max(1.0, $SmallRing * $size) }
  $gap = $SmallGapPlain; if ($ring) { $gap = $SmallGapRing }
  $inkR = $discR - $ringW - $gap * $size
  $span = $size * $MonoR / $inkR            # master pixels across the icon
  $tile = New-Canvas $size $size
  $g = New-Gfx $tile
  $g.Clear([System.Drawing.Color]::White)
  Copy-ImageRegion $g $mono.Bitmap ($mono.Cx - $span / 2) ($mono.Cy - $span / 2) $span $span 0 0 $size $size
  $g.Dispose()
  $icon = New-Canvas $size $size
  $g = New-Gfx $icon
  $tb = New-Object System.Drawing.TextureBrush($tile)
  $c = $size / 2
  $g.FillEllipse($tb, (New-RectF ($c - $discR) ($c - $discR) (2 * $discR) (2 * $discR)))
  $tb.Dispose()
  if ($ring) {
    $pen = New-Object System.Drawing.Pen($Gold, [single]$ringW)
    $rr = $discR - $ringW / 2
    $g.DrawEllipse($pen, (New-RectF ($c - $rr) ($c - $rr) (2 * $rr) (2 * $rr)))
    $pen.Dispose()
  }
  $g.Dispose(); $tile.Dispose()
  return $icon
}

function New-LargeIcon($badge, [int]$size, [double]$fill, [bool]$opaque) {
  $icon = New-Canvas $size $size
  $g = New-Gfx $icon
  if ($opaque) { $g.Clear([System.Drawing.Color]::White) }
  $d = $fill * $size
  $r = $badge.Radius
  Copy-ImageRegion $g $badge.Bitmap ($BadgeCx - $r) ($BadgeCy - $r) (2 * $r) (2 * $r) (($size - $d) / 2) (($size - $d) / 2) $d $d
  $g.Dispose()
  return $icon
}

# PNG bytes with only the critical chunks (IHDR, PLTE, IDAT, IEND).
function Get-PngBytes($bmp, [bool]$opaque) {
  $w = $bmp.Width; $h = $bmp.Height
  $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  if ($opaque) {
    $out = New-Object System.Drawing.Bitmap($w, $h, $PF::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.Clear([System.Drawing.Color]::White)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $g.DrawImage($bmp, $rect)
    $g.Dispose()
  } else {
    $out = $bmp.Clone($rect, $PF::Format32bppArgb)
  }
  $ms = New-Object System.IO.MemoryStream
  try {
    $out.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $raw = $ms.ToArray()
  } finally { $ms.Dispose(); $out.Dispose() }
  $clean = New-Object System.IO.MemoryStream
  $clean.Write($raw, 0, 8)
  $p = 8
  while ($p + 8 -le $raw.Length) {
    $len = ([long]$raw[$p] -shl 24) -bor ([long]$raw[$p + 1] -shl 16) -bor ([long]$raw[$p + 2] -shl 8) -bor [long]$raw[$p + 3]
    $type = [System.Text.Encoding]::ASCII.GetString($raw, $p + 4, 4)
    $total = [int](12 + $len)
    if ($type -eq 'IHDR' -or $type -eq 'PLTE' -or $type -eq 'IDAT' -or $type -eq 'IEND') { $clean.Write($raw, $p, $total) }
    $p += $total
  }
  return ,$clean.ToArray()
}

# ICO: ICONDIR, one 16-byte ICONDIRENTRY per frame, then the frames, each
# stored as PNG data (Windows Vista and later, every current browser).
function Get-IcoBytes($frames) {
  $ms = New-Object System.IO.MemoryStream
  $bw = New-Object System.IO.BinaryWriter($ms)
  $bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$frames.Count)
  $offset = 6 + 16 * $frames.Count
  foreach ($f in $frames) {
    $dim = $f.Size; if ($dim -ge 256) { $dim = 0 }   # one byte; 0 means 256
    $bw.Write([byte]$dim); $bw.Write([byte]$dim); $bw.Write([byte]0); $bw.Write([byte]0)
    $bw.Write([uint16]1); $bw.Write([uint16]32)
    $bw.Write([uint32]$f.Png.Length); $bw.Write([uint32]$offset)
    $offset += $f.Png.Length
  }
  foreach ($f in $frames) { $bw.Write([byte[]]$f.Png) }
  $bw.Flush()
  $bytes = $ms.ToArray()
  $bw.Dispose()
  return ,$bytes
}

function Get-U32BE([byte[]]$b, [int]$p) {
  return ([long]$b[$p] -shl 24) -bor ([long]$b[$p + 1] -shl 16) -bor ([long]$b[$p + 2] -shl 8) -bor [long]$b[$p + 3]
}

# Checks one PNG (bytes): signature, chunk list, size, corner alpha.
function Test-PngBytes([byte[]]$b, [int]$size, [bool]$opaque, [string]$what) {
  $sig = 137, 80, 78, 71, 13, 10, 26, 10
  for ($i = 0; $i -lt 8; $i++) { if ($b[$i] -ne $sig[$i]) { throw "$what is not a PNG" } }
  $types = New-Object System.Collections.ArrayList
  $p = 8
  while ($p + 8 -le $b.Length) {
    $len = Get-U32BE $b $p
    [void]$types.Add([System.Text.Encoding]::ASCII.GetString($b, $p + 4, 4))
    $p += [int](12 + $len)
  }
  if ($p -ne $b.Length) { throw "$what has a truncated chunk" }
  if ($types[0] -ne 'IHDR' -or $types[$types.Count - 1] -ne 'IEND') { throw "$what chunk order is wrong" }
  foreach ($t in $types) { if ('IHDR', 'PLTE', 'IDAT', 'IEND' -notcontains $t) { throw "$what has an extra chunk: $t" } }
  if ((Get-U32BE $b 16) -ne $size -or (Get-U32BE $b 20) -ne $size) { throw "$what is not $size x $size" }
  $ms = New-Object System.IO.MemoryStream(, $b)
  $img = New-Object System.Drawing.Bitmap($ms)
  try {
    if ($img.Width -ne $size -or $img.Height -ne $size) { throw "$what decodes to the wrong size" }
    $want = 0; if ($opaque) { $want = 255 }
    foreach ($pt in @(@(0, 0), @(($size - 1), 0), @(0, ($size - 1)), @(($size - 1), ($size - 1)))) {
      $a = $img.GetPixel($pt[0], $pt[1]).A
      if ($a -ne $want) { throw "$what corner ($($pt[0]),$($pt[1])) alpha is $a, expected $want" }
    }
    if (-not $opaque) {
      $mid = $img.GetPixel([int]($size / 2), [int]($size / 2)).A
      if ($mid -ne 255) { throw "$what centre is not opaque" }
    }
  } finally { $img.Dispose(); $ms.Dispose() }
}

# Re-parses an ICO file: header, every entry, PNG frames back to back.
function Test-IcoFile([string]$path, [int[]]$sizes) {
  $b = [System.IO.File]::ReadAllBytes($path)
  $u16 = { param($p) [int]$b[$p] -bor ([int]$b[$p + 1] -shl 8) }
  $u32 = { param($p) [long]$b[$p] -bor ([long]$b[$p + 1] -shl 8) -bor ([long]$b[$p + 2] -shl 16) -bor ([long]$b[$p + 3] -shl 24) }
  if ((& $u16 0) -ne 0 -or (& $u16 2) -ne 1) { throw "$path has a bad ICONDIR" }
  $n = & $u16 4
  if ($n -ne $sizes.Count) { throw "$path has $n frames, expected $($sizes.Count)" }
  $expect = 6 + 16 * $n
  for ($i = 0; $i -lt $n; $i++) {
    $e = 6 + 16 * $i
    $wd = [int]$b[$e]; if ($wd -eq 0) { $wd = 256 }
    $ht = [int]$b[$e + 1]; if ($ht -eq 0) { $ht = 256 }
    if ($wd -ne $sizes[$i] -or $ht -ne $sizes[$i]) { throw "$path entry $i is $wd x $ht, expected $($sizes[$i])" }
    if ($b[$e + 2] -ne 0 -or $b[$e + 3] -ne 0 -or (& $u16 ($e + 4)) -ne 1 -or (& $u16 ($e + 6)) -ne 32) { throw "$path entry $i has bad fields" }
    $len = & $u32 ($e + 8); $off = & $u32 ($e + 12)
    if ($off -ne $expect -or $off + $len -gt $b.Length) { throw "$path entry $i points outside the file" }
    $frame = New-Object byte[] $len
    [Array]::Copy($b, $off, $frame, 0, $len)
    Test-PngBytes $frame $sizes[$i] $false "$path frame $($sizes[$i])"
    $expect = $off + $len
  }
  if ($expect -ne $b.Length) { throw "$path has trailing bytes" }
}

# ---- Contact sheet (optional): every output, actual size, light and dark ----
function Write-ContactSheet([string]$path, $outputs, $edge, [string]$masterPath, [string]$root) {
  $W = 1720; $H = 6000
  $sheet = New-Object System.Drawing.Bitmap($W, $H, $PF::Format32bppArgb)
  $g = New-Gfx $sheet
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::FromArgb(255, 226, 228, 232))
  $font = New-Object System.Drawing.Font('Segoe UI', 9)
  $bold = New-Object System.Drawing.Font('Segoe UI', 12, [System.Drawing.FontStyle]::Bold)
  $ink = [System.Drawing.Brushes]::Black
  $light = [System.Drawing.Color]::White
  $dark = [System.Drawing.Color]::FromArgb(255, 30, 30, 30)
  $loaded = New-Object System.Collections.ArrayList
  $load = {
    param([byte[]]$bytes)
    $ms = New-Object System.IO.MemoryStream(, $bytes)
    $bm = New-Object System.Drawing.Bitmap($ms)
    [void]$loaded.Add($bm); [void]$loaded.Add($ms)
    return $bm
  }
  $tile = {
    param($img, [int]$x, [int]$y, $bg)
    $s = $img.Width
    $b = New-Object System.Drawing.SolidBrush($bg)
    $g.FillRectangle($b, $x, $y, $s + 16, $s + 16); $b.Dispose()
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle(($x + 8), ($y + 8), $s, $s)))
  }

  $y = 8
  $g.DrawString('HC Fashion House icons - every output at actual size, on white and on #1E1E1E', $bold, $ink, 8, $y)
  $y += 30
  $x = 8; $rowH = 0
  foreach ($o in $outputs) {
    $bytes = [System.IO.File]::ReadAllBytes($o.Path)
    $images = New-Object System.Collections.ArrayList
    if ($o.Ico) {
      $n = [int]$bytes[4] -bor ([int]$bytes[5] -shl 8)
      for ($i = 0; $i -lt $n; $i++) {
        $e = 6 + 16 * $i
        $len = [BitConverter]::ToUInt32($bytes, $e + 8); $off = [BitConverter]::ToUInt32($bytes, $e + 12)
        $fr = New-Object byte[] $len
        [Array]::Copy($bytes, [int]$off, $fr, 0, [int]$len)
        [void]$images.Add((& $load $fr))
      }
    } else { [void]$images.Add((& $load $bytes)) }
    $need = 0; $tall = 0
    foreach ($im in $images) { $need += $im.Width + 22; if ($im.Width -gt $tall) { $tall = $im.Width } }
    $sideBySide = ($images.Count -eq 1 -and $tall -ge 192)
    if ($sideBySide) { $blockW = 2 * ($tall + 16) + 6; $blockH = $tall + 16 + 22 }
    else { $blockW = [Math]::Max($need, 260); $blockH = 2 * ($tall + 16) + 22 }
    if ($x + $blockW -gt $W - 8) { $x = 8; $y += $rowH + 10; $rowH = 0 }
    $g.DrawString($o.Rel, $font, $ink, $x, $y)
    $cx = $x
    foreach ($im in $images) {
      & $tile $im $cx ($y + 18) $light
      if ($sideBySide) { & $tile $im ($cx + $tall + 22) ($y + 18) $dark }
      else { & $tile $im $cx ($y + 18 + $tall + 18) $dark }
      $cx += $im.Width + 22
    }
    $x += $blockW + 14
    if ($blockH -gt $rowH) { $rowH = $blockH }
  }
  $y += $rowH + 16

  # Small sizes on the real backgrounds: app light, app dark, launcher, taskbar.
  $g.DrawString('Small tier and badge on the app light page, app dark sidebar, launcher (#0D1526) and dark taskbar (#202020)', $bold, $ink, 8, $y)
  $y += 26
  $ico = $outputs | Where-Object { $_.Rel -like '*app-icon.ico' } | Select-Object -First 1
  $frames = New-Object System.Collections.ArrayList
  $ib = [System.IO.File]::ReadAllBytes($ico.Path)
  $n = [int]$ib[4] -bor ([int]$ib[5] -shl 8)
  for ($i = 0; $i -lt $n; $i++) {
    $e = 6 + 16 * $i
    $len = [BitConverter]::ToUInt32($ib, $e + 8); $off = [BitConverter]::ToUInt32($ib, $e + 12)
    $fr = New-Object byte[] $len
    [Array]::Copy($ib, [int]$off, $fr, 0, [int]$len)
    [void]$frames.Add((& $load $fr))
  }
  $bgs = @([System.Drawing.Color]::FromArgb(255, 240, 242, 245), [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
           [System.Drawing.Color]::FromArgb(255, 13, 21, 38), [System.Drawing.Color]::FromArgb(255, 32, 32, 32))
  foreach ($bg in $bgs) {
    $b = New-Object System.Drawing.SolidBrush($bg)
    $g.FillRectangle($b, 8, $y, $W - 16, 276); $b.Dispose()
    $cx = 20
    foreach ($im in $frames) {
      $g.DrawImage($im, (New-Object System.Drawing.Rectangle($cx, ($y + 10 + 256 - $im.Height), $im.Width, $im.Height)))
      $cx += $im.Width + 18
    }
    $y += 284
  }

  # 4x zoom of the smallest frames, nearest neighbour.
  $g.DrawString('4x zoom (nearest neighbour) of the 16, 20, 24, 32, 40 and 48 px frames', $bold, $ink, 8, $y)
  $y += 26
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $cx = 8
  foreach ($im in $frames) {
    if ($im.Width -gt 48) { continue }
    $z = 4 * $im.Width
    foreach ($bg in @($light, $dark)) {
      $b = New-Object System.Drawing.SolidBrush($bg)
      $g.FillRectangle($b, $cx, $y, $z + 16, $z + 16); $b.Dispose()
      $g.DrawImage($im, (New-Object System.Drawing.Rectangle(($cx + 8), ($y + 8), $z, $z)))
      $cx += $z + 22
    }
  }
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $y += 4 * 48 + 30

  # The sidebar: hc-monogram-64.png at 40 CSS px beside the two-line name.
  $g.DrawString('Sidebar (40 px logo, "HC Fashion / House"), light and dark; maskable 512 at 50% with the 80% safe zone; apple-touch 180', $bold, $ink, 8, $y)
  $y += 26
  $mono64 = & $load ([System.IO.File]::ReadAllBytes((Join-Path $root 'public\brand\hc-monogram-64.png')))
  $nameFont = New-Object System.Drawing.Font('Segoe UI', 13.8, [System.Drawing.FontStyle]::Bold)
  $sx = 8
  foreach ($pair in @(@([System.Drawing.Color]::White, [System.Drawing.Color]::FromArgb(255, 15, 23, 42)), @([System.Drawing.Color]::FromArgb(255, 15, 23, 42), [System.Drawing.Color]::White))) {
    $b = New-Object System.Drawing.SolidBrush($pair[0])
    $g.FillRectangle($b, $sx, $y, 260, 90); $b.Dispose()
    $g.DrawImage($mono64, (New-Object System.Drawing.Rectangle(($sx + 28), ($y + 25), 40, 40)))
    $tb = New-Object System.Drawing.SolidBrush($pair[1])
    $g.DrawString("HC Fashion`nHouse", $nameFont, $tb, ($sx + 76), ($y + 22)); $tb.Dispose()
    $sx += 280
  }
  $mask = & $load ([System.IO.File]::ReadAllBytes((Join-Path $root 'public\icons\maskable-512.png')))
  $g.DrawImage($mask, (New-Object System.Drawing.Rectangle($sx, $y, 256, 256)))
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 220, 0, 0), 1)
  $g.DrawEllipse($pen, (New-RectF ($sx + 25.6) ($y + 25.6) 204.8 204.8))
  $sx += 276
  $apple = & $load ([System.IO.File]::ReadAllBytes((Join-Path $root 'public\icons\apple-touch-180.png')))
  $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
  $rr = 40
  $gp.AddArc($sx, $y, $rr, $rr, 180, 90); $gp.AddArc($sx + 180 - $rr, $y, $rr, $rr, 270, 90)
  $gp.AddArc($sx + 180 - $rr, $y + 180 - $rr, $rr, $rr, 0, 90); $gp.AddArc($sx, $y + 180 - $rr, $rr, $rr, 90, 90)
  $gp.CloseFigure()
  $g.SetClip($gp)
  $g.DrawImage($apple, (New-Object System.Drawing.Rectangle($sx, $y, 180, 180)))
  $g.ResetClip(); $gp.Dispose()
  $y += 276

  # Geometry on the master: ring edge cut (red), monogram box (blue), ring
  # cut for the monogram (green), the monogram's circle (magenta).
  $g.DrawString('Geometry on the master (50%): badge cut along the ring (red), monogram box (blue), interior cut (green), monogram circle (magenta)', $bold, $ink, 8, $y)
  $y += 26
  $mb = [System.IO.File]::ReadAllBytes($masterPath)
  $master = & $load $mb
  $sc = 0.5; $ox = 8; $oy = $y
  $g.DrawImage($master, (New-Object System.Drawing.Rectangle($ox, $oy, [int]($MasterSize * $sc), [int]($MasterSize * $sc))))
  $pts = New-Object System.Collections.ArrayList
  for ($i = 0; $i -lt 180; $i++) {
    $t = $i * [Math]::PI / 90.0; $r = $edge[$i] - $EdgeInset
    [void]$pts.Add((New-Object System.Drawing.PointF([single]($ox + $sc * ($BadgeCx + $r * [Math]::Cos($t))), [single]($oy + $sc * ($BadgeCy + $r * [Math]::Sin($t))))))
  }
  $red = New-Object System.Drawing.Pen([System.Drawing.Color]::Red, 1)
  $g.DrawPolygon($red, [System.Drawing.PointF[]]$pts.ToArray())
  $blue = New-Object System.Drawing.Pen([System.Drawing.Color]::Blue, 1)
  $g.DrawRectangle($blue, [single]($ox + $sc * $MonoBox.X), [single]($oy + $sc * $MonoBox.Y), [single]($sc * $MonoBox.W), [single]($sc * $MonoBox.H))
  $green = New-Object System.Drawing.Pen([System.Drawing.Color]::Green, 1)
  $g.DrawEllipse($green, [single]($ox + $sc * ($BadgeCx - $MonoCutR)), [single]($oy + $sc * ($BadgeCy - $MonoCutR)), [single]($sc * 2 * $MonoCutR), [single]($sc * 2 * $MonoCutR))
  $mag = New-Object System.Drawing.Pen([System.Drawing.Color]::Magenta, 1)
  $g.DrawEllipse($mag, [single]($ox + $sc * ($MonoCx - $MonoR)), [single]($oy + $sc * ($MonoCy - $MonoR)), [single]($sc * 2 * $MonoR), [single]($sc * 2 * $MonoR))
  # and the top-left corner at 200%, where the H serif runs closest to the ring
  $zx = $ox + [int]($MasterSize * $sc) + 20
  $g.DrawImage($master, (New-Object System.Drawing.Rectangle($zx, $oy, 440, 300)), 250, 90, 220, 150, [System.Drawing.GraphicsUnit]::Pixel)
  $zpts = New-Object System.Collections.ArrayList
  foreach ($p in $pts) { [void]$zpts.Add((New-Object System.Drawing.PointF([single]($zx + 2 * (($p.X - $ox) / $sc - 250)), [single]($oy + 2 * (($p.Y - $oy) / $sc - 90))))) }
  $g.SetClip((New-Object System.Drawing.Rectangle($zx, $oy, 440, 300)))
  $g.DrawPolygon($red, [System.Drawing.PointF[]]$zpts.ToArray())
  $g.DrawEllipse($green, [single]($zx + 2 * ($BadgeCx - $MonoCutR - 250)), [single]($oy + 2 * ($BadgeCy - $MonoCutR - 90)), [single](4 * $MonoCutR), [single](4 * $MonoCutR))
  $g.DrawRectangle($blue, [single]($zx + 2 * ($MonoBox.X - 250)), [single]($oy + 2 * ($MonoBox.Y - 90)), [single](2 * $MonoBox.W), [single](2 * $MonoBox.H))
  $g.ResetClip()
  foreach ($p in @($red, $blue, $green, $mag, $pen)) { $p.Dispose() }
  $y += [int]($MasterSize * $sc) + 12

  $g.Dispose()
  $final = $sheet.Clone((New-Object System.Drawing.Rectangle(0, 0, $W, [Math]::Min($H, $y))), $PF::Format32bppArgb)
  $sheet.Dispose()
  $dir = Split-Path -Parent $path
  if ($dir -and -not (Test-Path -LiteralPath $dir)) { [void](New-Item -ItemType Directory -Path $dir) }
  $final.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $final.Dispose()
  foreach ($o in $loaded) { $o.Dispose() }
  $font.Dispose(); $bold.Dispose(); $nameFont.Dispose()
}

# ---------------------------------------------------------------------------
try {
  if (-not $RepoRoot) {
    $here = $PSScriptRoot
    if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Path }
    $RepoRoot = Split-Path -Parent $here
  }
  $RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).ProviderPath
  if (-not $Source) { $Source = Join-Path $RepoRoot 'branding\hc_icon-master.jpg' }
  if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) { throw "Master logo not found: $Source" }
  $Source = (Resolve-Path -LiteralPath $Source).ProviderPath

  # Step 0: the geometry above belongs to this exact master.
  $srcBytes = [System.IO.File]::ReadAllBytes($Source)
  $srcStream = New-Object System.IO.MemoryStream(, $srcBytes)
  $loadedMaster = [System.Drawing.Image]::FromStream($srcStream, $false, $true)
  if ($loadedMaster.Width -ne $MasterSize -or $loadedMaster.Height -ne $MasterSize) {
    throw "Master is $($loadedMaster.Width) x $($loadedMaster.Height); expected $MasterSize x $MasterSize. Re-measure the geometry before using another master."
  }
  if ($loadedMaster.PixelFormat -ne $PF::Format24bppRgb -or [System.Drawing.Image]::IsAlphaPixelFormat($loadedMaster.PixelFormat)) {
    throw "Master pixel format is $($loadedMaster.PixelFormat); expected Format24bppRgb (no alpha)."
  }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $masterHash = ([BitConverter]::ToString($sha.ComputeHash($srcBytes))).Replace('-', '').ToLowerInvariant()
  Write-Host ("master  {0}  {1} x {1}, {2}  sha256 {3}" -f $Source, $MasterSize, $loadedMaster.PixelFormat, $masterHash)

  # A fresh bitmap: no EXIF or other metadata from the JPEG goes any further.
  $master = New-Object System.Drawing.Bitmap($MasterSize, $MasterSize, $PF::Format32bppArgb)
  $gm = [System.Drawing.Graphics]::FromImage($master)
  $gm.DrawImage($loadedMaster, (New-Object System.Drawing.Rectangle(0, 0, $MasterSize, $MasterSize)))
  $gm.Dispose(); $loadedMaster.Dispose(); $srcStream.Dispose()

  $badge = New-BadgeCutout $master
  $edgeMin = ($badge.Edge | Measure-Object -Minimum).Minimum
  $edgeMax = ($badge.Edge | Measure-Object -Maximum).Maximum
  $edgeAvg = ($badge.Edge | Measure-Object -Average).Average
  Write-Host ("badge   ring edge radius {0:N1}-{1:N1} px (mean {2:N1}) about ({3}, {4}); cut {5} px inside, {6} px feather" -f $edgeMin, $edgeMax, $edgeAvg, $BadgeCx, $BadgeCy, $EdgeInset, $Feather)
  $mono = New-MonogramSource $master

  $small = @{}
  foreach ($s in 16, 20, 24, 32, 40, 48, 64, 96, 128) { $small[$s] = New-SmallIcon $mono $s }
  $large = @{}
  foreach ($s in 128, 192, 256, 512) { $large[$s] = New-LargeIcon $badge $s $FillAny $false }
  $maskable = @{}
  foreach ($s in 192, 512) { $maskable[$s] = New-LargeIcon $badge $s $FillMaskable $true }
  $apple = New-LargeIcon $badge 180 $FillApple $true

  $png = @{}
  foreach ($s in $small.Keys) { $png["s$s"] = Get-PngBytes $small[$s] $false }
  foreach ($s in $large.Keys) { $png["l$s"] = Get-PngBytes $large[$s] $false }
  foreach ($s in $maskable.Keys) { $png["m$s"] = Get-PngBytes $maskable[$s] $true }
  $png['a180'] = Get-PngBytes $apple $true

  $outputs = @(
    @{ Rel = 'public/favicon.ico'; Ico = $true; Sizes = @(16, 32, 48); Parts = @('s16', 's32', 's48') },
    @{ Rel = 'public/favicon-32.png'; Key = 's32'; Size = 32; Opaque = $false },
    @{ Rel = 'public/icons/icon-192.png'; Key = 'l192'; Size = 192; Opaque = $false },
    @{ Rel = 'public/icons/icon-512.png'; Key = 'l512'; Size = 512; Opaque = $false },
    @{ Rel = 'public/icons/maskable-192.png'; Key = 'm192'; Size = 192; Opaque = $true },
    @{ Rel = 'public/icons/maskable-512.png'; Key = 'm512'; Size = 512; Opaque = $true },
    @{ Rel = 'public/icons/apple-touch-180.png'; Key = 'a180'; Size = 180; Opaque = $true },
    @{ Rel = 'public/brand/hc-monogram-64.png'; Key = 's64'; Size = 64; Opaque = $false },
    @{ Rel = 'public/brand/hc-monogram-128.png'; Key = 's128'; Size = 128; Opaque = $false },
    @{ Rel = 'public/brand/hc-badge-256.png'; Key = 'l256'; Size = 256; Opaque = $false },
    @{ Rel = 'public/brand/hc-badge-512.png'; Key = 'l512'; Size = 512; Opaque = $false },
    @{ Rel = 'release-templates/_system-scripts/app-icon.ico'; Ico = $true; Sizes = @(16, 20, 24, 32, 40, 48, 64, 96, 128, 256);
       Parts = @('s16', 's20', 's24', 's32', 's40', 's48', 's64', 's96', 'l128', 'l256') }
  )

  foreach ($o in $outputs) {
    $o.Path = Join-Path $RepoRoot ($o.Rel -replace '/', '\')
    if (-not $o.ContainsKey('Ico')) { $o.Ico = $false }
    $dir = Split-Path -Parent $o.Path
    if (-not (Test-Path -LiteralPath $dir)) { [void](New-Item -ItemType Directory -Path $dir) }
    if ($o.Ico) {
      $frames = @()
      for ($i = 0; $i -lt $o.Sizes.Count; $i++) {
        $frames += @{ Size = $o.Sizes[$i]; Png = $png[$o.Parts[$i]] }
        Test-PngBytes $png[$o.Parts[$i]] $o.Sizes[$i] $false "$($o.Rel) frame $($o.Sizes[$i])"
      }
      [System.IO.File]::WriteAllBytes($o.Path, (Get-IcoBytes $frames))
    } else {
      Test-PngBytes $png[$o.Key] $o.Size $o.Opaque $o.Rel
      [System.IO.File]::WriteAllBytes($o.Path, $png[$o.Key])
    }
  }

  # Self-check what is on disk, then report.
  Write-Host ''
  foreach ($o in $outputs) {
    if ($o.Ico) { Test-IcoFile $o.Path $o.Sizes; $what = ($o.Sizes -join ',') + ' px ico (png frames)' }
    else { Test-PngBytes ([System.IO.File]::ReadAllBytes($o.Path)) $o.Size $o.Opaque $o.Rel; $what = "$($o.Size) px png" + $(if ($o.Opaque) { ', opaque' } else { '' }) }
    $hash = ([BitConverter]::ToString($sha.ComputeHash([System.IO.File]::ReadAllBytes($o.Path)))).Replace('-', '').ToLowerInvariant()
    $o.Hash = $hash
    Write-Host ("{0,-48} {1,-38} {2,8:N0} B  sha256 {3}" -f $o.Rel, $what, (Get-Item -LiteralPath $o.Path).Length, $hash)
  }

  if ($ContactSheet) {
    Write-ContactSheet $ContactSheet $outputs $badge.Edge $Source $RepoRoot
    Write-Host ''
    Write-Host "contact sheet: $ContactSheet"
  }

  foreach ($b in @($small.Values) + @($large.Values) + @($maskable.Values) + @($apple)) { $b.Dispose() }
  $badge.Bitmap.Dispose(); $mono.Bitmap.Dispose(); $master.Dispose(); $sha.Dispose()
  Write-Host ''
  Write-Host "Wrote $($outputs.Count) files. All checks passed."
} catch {
  [Console]::Error.WriteLine("generate-icons: $($_.Exception.Message)")
  exit 1
}
