param(
  [string]$InputDir = 'media\source',
  [int]$MaxMiB = 24
)

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$inputPath = Join-Path $root $InputDir
$media = Join-Path $root 'media'
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue

if (-not $ffmpeg) {
  throw '未找到 ffmpeg。请先安装 ffmpeg，或把 ffmpeg.exe 所在目录加入 PATH 后重试。'
}

if (-not (Test-Path $inputPath)) {
  New-Item -ItemType Directory -Force -Path $inputPath | Out-Null
  Write-Host "Created $InputDir. Put raw media files there and run this script again."
  exit 0
}

function Get-NextName($dirName, $prefix, $extension) {
  $dir = Join-Path $media $dirName
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $existing = Get-ChildItem -Path $dir -File -Filter "$prefix-*.$extension" |
    ForEach-Object {
      if ($_.BaseName -match "$prefix-(\d+)$") { [int]$Matches[1] }
    }
  $next = 1
  if ($existing) { $next = (($existing | Measure-Object -Maximum).Maximum + 1) }
  return Join-Path $dir ('{0}-{1:000}.{2}' -f $prefix, $next, $extension)
}

function Compress-Video($input, $output, $isGif) {
  $crfList = @(28, 32, 36, 40)
  $targetBytes = $MaxMiB * 1024 * 1024
  foreach ($crf in $crfList) {
    $vf = if ($isGif) {
      "fps=15,scale='min(960,iw)':-2:flags=lanczos"
    } else {
      "fps=30,scale='min(1280,iw)':-2:force_original_aspect_ratio=decrease:flags=lanczos"
    }

    & $ffmpeg.Source -y -i $input -vf $vf -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart -preset slow -crf $crf $output
    if ((Test-Path $output) -and ((Get-Item $output).Length -le $targetBytes)) { return }
  }
}

function Compress-Image($input, $output) {
  & $ffmpeg.Source -y -i $input -vf "scale='min(1600,iw)':-2:force_original_aspect_ratio=decrease:flags=lanczos" -q:v 75 $output
}

$files = Get-ChildItem -Path $inputPath -File -Recurse |
  Where-Object { @('.gif', '.mp4', '.mov', '.mkv', '.avi', '.jpg', '.jpeg', '.png', '.webp') -contains $_.Extension.ToLowerInvariant() } |
  Sort-Object FullName

foreach ($file in $files) {
  $ext = $file.Extension.ToLowerInvariant()
  if (@('.gif', '.mp4', '.mov', '.mkv', '.avi') -contains $ext) {
    $out = Get-NextName 'videos' 'clip' 'mp4'
    Compress-Video $file.FullName $out ($ext -eq '.gif')
    Write-Host ("Video: {0} -> {1}" -f $file.Name, (Split-Path $out -Leaf))
  } else {
    $out = Get-NextName 'images' 'shot' 'webp'
    Compress-Image $file.FullName $out
    Write-Host ("Image: {0} -> {1}" -f $file.Name, (Split-Path $out -Leaf))
  }
}

& (Join-Path $PSScriptRoot 'rebuild-works.ps1')
