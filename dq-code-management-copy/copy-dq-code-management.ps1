param(
  [Parameter(Mandatory = $true)]
  [string]$TargetProject
)

$ErrorActionPreference = "Stop"
$source = Join-Path $PSScriptRoot "src/app/features/dq-code-management"
$target = Join-Path $TargetProject "src/app/features/dq-code-management"

if (-not (Test-Path $TargetProject)) { throw "Target project does not exist: $TargetProject" }
if (Test-Path $target) { throw "Target feature folder already exists. Back it up or choose a new target: $target" }

New-Item -ItemType Directory -Path (Split-Path $target -Parent) -Force | Out-Null
Copy-Item -Path $source -Destination $target -Recurse
Write-Host "Copied DQ Code Management feature to $target" -ForegroundColor Green
Write-Host "Next: add the lazy route and register AG Grid modules as documented in README.md."
