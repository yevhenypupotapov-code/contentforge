# Copyright (c) 2026 Yevhen Potapov. All rights reserved.
# ContentForge - bootstrap: fetch what the factory needs to run.
#
# Downloads and prepares, in this order:
#   1) FFmpeg        - static build, unpacked into runtime\ffmpeg
#   2) Ollama        - installer, then the language model is pulled
#   3) ComfyUI+LTXV  - reported with exact instructions (too large to pull safely)
#
# Nothing is installed silently behind your back: each step asks first.
param(
    [switch]$Yes
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$runtime = Join-Path $root 'runtime'
$tmp = Join-Path $runtime 'download'
New-Item -ItemType Directory -Force -Path $runtime, $tmp | Out-Null

function Say($m) { Write-Output $m }
function Ask($q) {
    if ($Yes) { return $true }
    $a = Read-Host "$q [y/N]"
    return ($a -eq 'y' -or $a -eq 'Y')
}
function HaveCmd($n) { [bool](Get-Command $n -ErrorAction SilentlyContinue) }

Say '================================================================'
Say ' ContentForge - bootstrap (download what the factory needs)'
Say '================================================================'
$free = [math]::Round((Get-PSDrive -Name ($root.Substring(0,1))).Free / 1GB, 1)
Say " Free space on this drive: $free GB"
Say ' Required in total: about 10 GB (FFmpeg 0.1, Ollama+model ~7, ComfyUI models 3+)'
Say ''

# ── 1. FFmpeg ───────────────────────────────────────────────────────────────
$ffDir = Join-Path $runtime 'ffmpeg'
$ffExe = Join-Path $ffDir 'ffmpeg.exe'
if ((Test-Path $ffExe) -or (HaveCmd 'ffmpeg')) {
    Say '[SKIP] FFmpeg is already available'
} else {
    Say '[STEP] FFmpeg - required for editing and encoding'
    if (Ask 'Download FFmpeg now (about 90 MB)?') {
        $zip = Join-Path $tmp 'ffmpeg.zip'
        try {
            Say '       downloading...'
            Invoke-WebRequest 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile $zip -UseBasicParsing
            Say '       unpacking...'
            Expand-Archive -Path $zip -DestinationPath $tmp -Force
            $bin = Get-ChildItem $tmp -Recurse -Filter 'ffmpeg.exe' | Select-Object -First 1
            if ($bin) {
                New-Item -ItemType Directory -Force -Path $ffDir | Out-Null
                Copy-Item $bin.FullName $ffDir -Force
                Copy-Item (Join-Path $bin.DirectoryName 'ffprobe.exe') $ffDir -Force -ErrorAction SilentlyContinue
                Say "[OK] FFmpeg ready: $ffExe"
            } else { Say '[WARN] ffmpeg.exe not found in the archive' }
            Remove-Item $zip -Force -ErrorAction SilentlyContinue
        } catch { Say "[WARN] FFmpeg download failed: $($_.Exception.Message)" }
    } else { Say '[SKIP] FFmpeg skipped - install it yourself later (winget install Gyan.FFmpeg)' }
}

# ── 2. Ollama + model ───────────────────────────────────────────────────────
Say ''
Say '[STEP] Ollama - the local language model that writes the script'
$ollamaUp = $false
try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 4 | Out-Null; $ollamaUp = $true } catch { }
if (-not $ollamaUp) {
    if (HaveCmd 'ollama') {
        Say '[INFO] Ollama is installed but not running - start it, then run this again'
    } elseif (Ask 'Download and install Ollama (about 700 MB)?') {
        $exe = Join-Path $tmp 'OllamaSetup.exe'
        try {
            Say '       downloading...'
            Invoke-WebRequest 'https://ollama.com/download/OllamaSetup.exe' -OutFile $exe -UseBasicParsing
            Say '       installing (this takes a minute)...'
            Start-Process -FilePath $exe -ArgumentList '/VERYSILENT', '/NORESTART' -Wait
            Say '[OK] Ollama installer finished'
        } catch { Say "[WARN] Ollama install failed: $($_.Exception.Message)" }
    } else { Say '[SKIP] Ollama skipped - get it at https://ollama.com/download' }
} else {
    Say '[OK] Ollama is already running'
}

try { Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 4 | Out-Null; $ollamaUp = $true } catch { $ollamaUp = $false }
if ($ollamaUp) {
    $model = 'ornith-1.5:9b'
    $has = $false
    try {
        $tags = Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 8
        $has = [bool]($tags.models | Where-Object { $_.name -like "$model*" })
    } catch { }
    if ($has) {
        Say "[SKIP] Model $model is already present"
    } elseif (Ask "Download the language model $model (about 6 GB)?") {
        Say '       pulling the model (long, progress is printed below)...'
        & ollama pull $model
        Say "[OK] Model pull finished"
    } else { Say "[SKIP] Model skipped - run: ollama pull $model" }
} else {
    Say '[WARN] Ollama is not running: start it and run bootstrap again to get the model'
}

# ── 3. ComfyUI + LTXV ───────────────────────────────────────────────────────
Say ''
Say '[STEP] ComfyUI + LTXV - renders the frames and the animation'
$comfyUp = $false
try { Invoke-RestMethod 'http://127.0.0.1:8188/system_stats' -TimeoutSec 4 | Out-Null; $comfyUp = $true } catch { }
if ($comfyUp) {
    Say '[OK] ComfyUI is running on 127.0.0.1:8188'
} else {
    Say '[ACTION NEEDED] ComfyUI is a large separate project with multi-gigabyte'
    Say '                model weights, so it is not pulled automatically. Steps:'
    Say '   1) install ComfyUI (portable build for Windows)'
    Say '      https://github.com/comfyanonymous/ComfyUI/releases'
    Say '   2) download the LTXV models into ComfyUI\models (see the repository notes)'
    Say '      https://github.com/Lightricks/LTX-Video'
    Say '   3) start ComfyUI so that it answers on http://127.0.0.1:8188'
    Say '   4) run option [1] Check this PC again - ComfyUI should turn green'
}

Say ''
Say '================================================================'
Say ' Bootstrap finished. Run option [1] Check this PC to see the state.'
Say '================================================================'
