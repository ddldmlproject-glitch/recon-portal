param(
  [Parameter(Mandatory = $true)]
  [string]$TargetProject,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceApp = Join-Path $repoRoot 'grouping-approvals-standalone\src\app'
$targetApp = Join-Path (Resolve-Path $TargetProject).Path 'src\app'

if (-not (Test-Path $sourceApp)) { throw "Source Admin app folder not found: $sourceApp" }
if (-not (Test-Path $targetApp)) { throw "Target Angular app folder not found: $targetApp" }

$folders = @('core', 'features', 'shared')
foreach ($folder in $folders) {
  $source = Join-Path $sourceApp $folder
  if (-not (Test-Path $source)) { continue }

  Get-ChildItem -Path $source -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($sourceApp.Length).TrimStart('\')
    $destination = Join-Path $targetApp $relative
    $destinationFolder = Split-Path -Parent $destination

    if (Test-Path $destination) {
      Write-Warning "SKIPPED existing file (compare/merge manually): $destination"
      return
    }

    if ($WhatIf) {
      Write-Host "WOULD COPY: $($_.FullName) -> $destination"
      return
    }

    New-Item -ItemType Directory -Path $destinationFolder -Force | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $destination
    Write-Host "COPIED: $relative"
  }
}

Write-Host ''
Write-Host 'Admin source copy completed. Review README.md for route, providers, AG Grid and Angular 18 integration.'
