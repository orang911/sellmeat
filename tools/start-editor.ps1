param(
  [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$settingsFile = Join-Path $root 'media\settings.js'

function Write-Response($Response, [int]$StatusCode, [string]$ContentType, [byte[]]$Bytes) {
  $Response.StatusCode = $StatusCode
  $Response.ContentType = $ContentType
  $Response.Headers['Cache-Control'] = 'no-store'
  $Response.ContentLength64 = $Bytes.Length
  $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
  $Response.OutputStream.Close()
}

function Write-TextResponse($Response, [int]$StatusCode, [string]$ContentType, [string]$Text) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  Write-Response $Response $StatusCode $ContentType $bytes
}

function Get-ContentType([string]$Path) {
  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8'; break }
    '.css' { 'text/css; charset=utf-8'; break }
    '.js' { 'application/javascript; charset=utf-8'; break }
    '.json' { 'application/json; charset=utf-8'; break }
    '.png' { 'image/png'; break }
    '.jpg' { 'image/jpeg'; break }
    '.jpeg' { 'image/jpeg'; break }
    '.gif' { 'image/gif'; break }
    '.webp' { 'image/webp'; break }
    '.mp4' { 'video/mp4'; break }
    '.webm' { 'video/webm'; break }
    default { 'application/octet-stream' }
  }
}

function Convert-ToStringArray($Value) {
  $items = @()
  if ($null -eq $Value) { return $items }
  foreach ($item in @($Value)) {
    if ($item -is [string] -and $item.Trim().Length -gt 0) {
      $items += $item
    }
  }
  return $items
}

function Convert-ToBilibiliArray($Value) {
  $items = @()
  if ($null -eq $Value) { return $items }
  foreach ($item in @($Value)) {
    if ($null -ne $item.src -and [string]$item.src) {
      $entry = [ordered]@{
        src = [string]$item.src
        type = 'bilibili'
        title = if ($null -ne $item.title -and [string]$item.title) { [string]$item.title } else { 'Bilibili Video' }
      }
      if ($null -ne $item.bvid -and [string]$item.bvid) {
        $entry.bvid = [string]$item.bvid
      }
      $items += [pscustomobject]$entry
    }
  }
  return $items
}

function ConvertTo-JsonString([string]$Value) {
  return ($Value | ConvertTo-Json -Compress)
}

function ConvertTo-JsonStringArray($Items) {
  $array = @($Items)
  if ($array.Count -eq 0) { return '[]' }
  return '[' + (($array | ForEach-Object { ConvertTo-JsonString ([string]$_) }) -join ', ') + ']'
}

function ConvertTo-BilibiliJson($Items) {
  $array = @($Items)
  if ($array.Count -eq 0) { return '[]' }

  $lines = @('[')
  for ($i = 0; $i -lt $array.Count; $i += 1) {
    $item = $array[$i]
    $comma = if ($i -lt ($array.Count - 1)) { ',' } else { '' }
    $hasBvid = $null -ne $item.bvid -and [string]$item.bvid
    $titleSuffix = if ($hasBvid) { ',' } else { '' }

    $lines += '    {'
    $lines += ('      src: ' + (ConvertTo-JsonString ([string]$item.src)) + ',')
    $lines += '      type: "bilibili",'
    $lines += ('      title: ' + (ConvertTo-JsonString ([string]$item.title)) + $titleSuffix)
    if ($hasBvid) {
      $lines += ('      bvid: ' + (ConvertTo-JsonString ([string]$item.bvid)))
    }
    $lines += ('    }' + $comma)
  }
  $lines += '  ]'
  return ($lines -join "`n")
}

function ConvertTo-SettingsJs($Settings) {
  $order = @($Settings.order)
  $hidden = @($Settings.hidden)
  $bilibili = @($Settings.bilibili)

  return (@(
    'window.portfolioSettings = {'
    ('  order: ' + (ConvertTo-JsonStringArray $order) + ',')
    ('  hidden: ' + (ConvertTo-JsonStringArray $hidden) + ',')
    ('  bilibili: ' + (ConvertTo-BilibiliJson $bilibili))
    '};'
  ) -join "`n") + "`n"
}

function Publish-Settings($Request, $Response) {
  $reader = [System.IO.StreamReader]::new($Request.InputStream, $Request.ContentEncoding)
  $body = $reader.ReadToEnd()
  $reader.Close()

  $inputSettings = $body | ConvertFrom-Json
  $settings = [ordered]@{
    order = Convert-ToStringArray $inputSettings.order
    hidden = Convert-ToStringArray $inputSettings.hidden
    bilibili = Convert-ToBilibiliArray $inputSettings.bilibili
  }

  Set-Content -Path $settingsFile -Value (ConvertTo-SettingsJs $settings) -Encoding UTF8

  Write-TextResponse $Response 200 'application/json; charset=utf-8' '{"ok":true}'
}

function Serve-Static($Request, $Response) {
  $relative = [System.Uri]::UnescapeDataString($Request.Url.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
  if ($relative -eq 'edit') { $relative = 'index.html' }

  $relative = $relative -replace '/', [System.IO.Path]::DirectorySeparatorChar
  $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
  if (-not $fullPath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    Write-TextResponse $Response 403 'text/plain; charset=utf-8' 'Forbidden'
    return
  }

  if ((Test-Path $fullPath -PathType Container)) {
    $fullPath = Join-Path $fullPath 'index.html'
  }

  if (-not (Test-Path $fullPath -PathType Leaf)) {
    Write-TextResponse $Response 404 'text/plain; charset=utf-8' 'Not found'
    return
  }

  if ($Request.HttpMethod -eq 'HEAD') {
    $Response.StatusCode = 200
    $Response.ContentType = Get-ContentType $fullPath
    $Response.Headers['Cache-Control'] = 'no-store'
    $Response.ContentLength64 = (Get-Item $fullPath).Length
    $Response.OutputStream.Close()
    return
  }

  $bytes = [System.IO.File]::ReadAllBytes($fullPath)
  Write-Response $Response 200 (Get-ContentType $fullPath) $bytes
}

# Check if the port is already in use by an existing server process.
$existing = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
if ($existing) {
  $proc = Get-Process -Id $existing.OwningProcess -ErrorAction SilentlyContinue
  Write-Host "Port $Port is already in use by $($proc.ProcessName) (PID $($existing.OwningProcess))."
  Write-Host "Server is already running. Opening browser..."
  Start-Process "http://127.0.0.1:${Port}/index.html?edit"
  exit 0
}

$listener = [System.Net.HttpListener]::new()
$prefix = "http://127.0.0.1:$Port/"
$listener.Prefixes.Add($prefix)

$started = $false
$retries = 3
for ($i = 0; $i -lt $retries; $i++) {
  try {
    $listener.Start()
    $started = $true
    break
  } catch [System.Net.HttpListenerException] {
    if ($_.Exception.Message -match 'already|conflict|registered') {
      Write-Host "Prefix conflict detected, cleaning up stale reservation..."
      try { $listener.Close() } catch {}
      # Force-remove stale URL ACL reservation left by a crashed process.
      $cleanup = netsh http delete urlacl url="$prefix" 2>&1
      if ($LASTEXITCODE -eq 0) { Write-Host "Stale reservation removed." }
      Start-Sleep -Milliseconds 500
    } else {
      throw
    }
  }
}

if (-not $started) {
  Write-Host "ERROR: Could not start server on $prefix after $retries attempts."
  Write-Host "Try running as Administrator to clear stale HTTP reservations, or restart your machine."
  exit 1
}

Write-Host "Portfolio editor: ${prefix}index.html?edit"
Write-Host "Portfolio works:  ${prefix}index.html#works"
Write-Host "Press Ctrl+C to stop."

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      $request = $context.Request
      $response = $context.Response

      if ($request.HttpMethod -eq 'GET' -and $request.Url.AbsolutePath -eq '/__portfolio-health') {
        Write-TextResponse $response 200 'application/json; charset=utf-8' '{"ok":true}'
      } elseif ($request.HttpMethod -eq 'POST' -and $request.Url.AbsolutePath -eq '/__portfolio-publish') {
        Publish-Settings $request $response
      } else {
        Serve-Static $request $response
      }
    } catch {
      try {
        Write-TextResponse $context.Response 500 'text/plain; charset=utf-8' $_.Exception.Message
      } catch {
        try { $context.Response.OutputStream.Close() } catch {}
      }
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
