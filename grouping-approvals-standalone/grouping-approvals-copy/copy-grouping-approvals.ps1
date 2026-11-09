param(
  [Parameter(Mandatory = $true)]
  [string]$TargetProject,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$sourceApp = Join-Path $PSScriptRoot 'src\app'
$targetRoot = (Resolve-Path $TargetProject).Path
$targetApp = Join-Path $targetRoot 'src\app'

if (-not (Test-Path $sourceApp)) { throw "Bundle source not found: $sourceApp" }
if (-not (Test-Path $targetApp)) { throw "Target Angular app folder not found: $targetApp" }

Get-ChildItem -Path $sourceApp -Recurse -File | ForEach-Object {
  $relative = $_.FullName.Substring($sourceApp.Length).TrimStart('\')
  $destination = Join-Path $targetApp $relative
  $destinationFolder = Split-Path -Parent $destination

  if (Test-Path $destination) {
    Write-Warning "SKIPPED existing file (compare/merge manually): $destination"
    return
  }

  if ($WhatIf) {
    Write-Host "WOULD COPY: $relative"
    return
  }

  New-Item -ItemType Directory -Path $destinationFolder -Force | Out-Null
  Copy-Item -LiteralPath $_.FullName -Destination $destination
  Write-Host "COPIED: $relative"
}

Write-Host ''
Write-Host 'Grouping Approvals bundle copy completed. Follow README.md for route, providers and dependency setup.'
