$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$media = Join-Path $root 'media'
$outFile = Join-Path $media 'works.js'

function Convert-ToWebPath([string]$path) {
  return (($path.Substring($root.Path.Length + 1)) -replace '\\', '/')
}

function Add-MediaItems($dirName, $type, $titlePrefix, [string[]]$extensions) {
  $dir = Join-Path $media $dirName
  if (-not (Test-Path $dir)) { return @() }

  $index = 1
  Get-ChildItem -Path $dir -File |
    Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object {
      $title = '{0} {1:000}' -f $titlePrefix, $index
      $index += 1
      [pscustomobject]@{
        src = Convert-ToWebPath $_.FullName
        type = $type
        title = $title
      }
    }
}

$items = @()
$items += Add-MediaItems 'videos' 'video' 'Video' @('.mp4', '.webm')
$items += Add-MediaItems 'gifs' 'gif' 'GIF' @('.gif')
$items += Add-MediaItems 'images' 'image' 'Image' @('.jpg', '.jpeg', '.png', '.webp')

$gamesDir = Join-Path $media 'games'
if (Test-Path $gamesDir) {
  $gameIndex = 1
  Get-ChildItem -Path $gamesDir -Directory |
    Sort-Object Name |
    ForEach-Object {
      $entry = Join-Path $_.FullName 'index.html'
      if (Test-Path $entry) {
        $items += [pscustomobject]@{
          src = Convert-ToWebPath $entry
          type = 'game'
          title = ('Game {0:000}' -f $gameIndex)
        }
        $gameIndex += 1
      }
    }
}

$lines = @()
$lines += 'window.portfolioWorks = ['
foreach ($item in $items) {
  $src = $item.src.Replace("'", "\'")
  $type = $item.type.Replace("'", "\'")
  $title = $item.title.Replace("'", "\'")
  $lines += "  { src: '$src', type: '$type', title: '$title' },"
}
$lines += '];'

Set-Content -Path $outFile -Value $lines -Encoding UTF8
Write-Host ("Generated {0} items in {1}" -f $items.Count, (Convert-ToWebPath $outFile))
