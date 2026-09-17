# ContentForge - install / update Python packages the factory needs.
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
    Write-Output 'During setup tick "Add python.exe to PATH".'
    exit 1
}

Write-Output "Using: $py"
& $py -m pip install --upgrade pip

$req = Join-Path $root 'requirements.txt'
if (Test-Path $req) {
    Write-Output "Installing from $req"
    & $py -m pip install -r $req
} else {
    Write-Output 'No requirements.txt - installing the core set.'
    $pkgs = @(
        'requests', 'pillow', 'numpy', 'moviepy', 'edge-tts', 'gTTS',
        'google-api-python-client', 'google-auth-oauthlib', 'imagehash'
    )
    & $py -m pip install @pkgs
}

Write-Output ''
Write-Output 'Done. Now run option [1] - Check this PC.'
