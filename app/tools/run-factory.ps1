param(
    [ValidateSet('shorts', 'long')]
    [string]$Kind = 'shorts'
)
# ContentForge - run one factory pass.
# Looks for the factory folder in this order:
#   1) -Factory <path>  (not used here, see CONTENTFORGE_ROOT)
#   2) env CONTENTFORGE_ROOT
#   3) .\factory  next to this package
$ErrorActionPreference = 'Continue'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here

$candidates = @()
if ($env:CONTENTFORGE_ROOT) { $candidates += $env:CONTENTFORGE_ROOT }
$candidates += (Join-Path $root 'factory')
$candidates += (Join-Path $env:USERPROFILE 'contentforge')
# No personal paths are baked in on purpose: point CONTENTFORGE_ROOT at your own folder.

$factory = $null
foreach ($c in $candidates) {
    if ($c -and (Test-Path (Join-Path $c 'AUTOPILOT.py'))) { $factory = $c; break }
    if ($c -and (Test-Path (Join-Path $c 'run_scheduled.ps1'))) { $factory = $c; break }
}
if (-not $factory) {
    Write-Output 'Factory folder not found.'
    Write-Output 'Set the environment variable CONTENTFORGE_ROOT to the folder that holds the factory scripts:'
    Write-Output '    setx CONTENTFORGE_ROOT "C:\path\to\factory"'
    exit 2
}
Write-Output "Factory root: $factory"

$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) { $py = (Get-Command py -ErrorAction SilentlyContinue).Source }

if ($Kind -eq 'shorts') {
    $script = Join-Path $factory 'AUTOPILOT.py'
    if (-not (Test-Path $script)) { Write-Output "Not found: $script"; exit 2 }
    Write-Output 'Running the Shorts factory (public)...'
    Push-Location $factory
    & $py $script --privacy public
    Pop-Location
} else {
    $script = Join-Path $factory 'run_scheduled.ps1'
    if (Test-Path $script) {
        Write-Output 'Running the long factory (public)...'
        & powershell -NoProfile -ExecutionPolicy Bypass -File $script
    } else {
        $alt = Join-Path $factory 'run.py'
        if (-not (Test-Path $alt)) { Write-Output 'Long factory script not found.'; exit 2 }
        Write-Output 'Running run.py --engine long (public)...'
        Push-Location $factory
        & $py $alt --engine long --lang ru --privacy public --segments 6
        Pop-Location
    }
}

Write-Output ''
Write-Output 'Finished. The published link (if any) is printed above and sent to Telegram.'
