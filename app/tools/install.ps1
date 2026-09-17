# Copyright (c) 2026 Yevhen Potapov. All rights reserved.
# ContentForge - install the Python packages into a private environment.
#
# Everything goes into ".venv" inside this folder. Your own Python packages are
# left alone: installing into the system interpreter can downgrade shared
# libraries (moviepy, for example, wants pillow<12).
$ErrorActionPreference = 'Continue'

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here

$py = $null
foreach ($c in @('python', 'py')) {
    $p = Get-Command $c -ErrorAction SilentlyContinue
    if ($p) { $py = $p.Source; break }
}
if (-not $py) {
    Write-Output 'Python not found. Install Python 3.10+ from https://www.python.org/downloads/windows/'
    Write-Output 'During setup tick "Add python.exe to PATH", then run this again.'
    exit 1
}
Write-Output "Using: $py"

$venv = Join-Path $root '.venv'
$vpy = Join-Path $venv 'Scripts\python.exe'
if (-not (Test-Path $vpy)) {
    Write-Output "Creating a private environment: $venv"
    & $py -m venv $venv
}
if (-not (Test-Path $vpy)) {
    Write-Output 'Could not create the private environment. Check that Python is installed correctly.'
    exit 1
}

& $vpy -m pip install --upgrade pip
$req = Join-Path $root 'requirements.txt'
if (Test-Path $req) {
    Write-Output "Installing from $req"
    & $vpy -m pip install -r $req
} else {
    & $vpy -m pip install requests pillow numpy moviepy edge-tts gTTS google-api-python-client google-auth-oauthlib imagehash
}

Write-Output ''
Write-Output 'Done. The packages live inside the app folder (.venv), nothing else on your PC was changed.'
Write-Output 'Now run option [1] - Check this PC.'
