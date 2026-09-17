# ContentForge - system check for Windows.
# Verifies everything the factory needs, without changing anything.
$ErrorActionPreference = 'Continue'

function Line($label, $value, $ok) {
    $mark = if ($ok -eq $true) { '[ OK ]' } elseif ($ok -eq $false) { '[MISS]' } else { '[ -- ]' }
    '{0} {1,-26} {2}' -f $mark, $label, $value
}

Write-Output '================================================================'
Write-Output ' ContentForge - system check'
Write-Output '================================================================'

$ps = $PSVersionTable.PSVersion.ToString()
Line 'PowerShell' $ps ($PSVersionTable.PSVersion.Major -ge 5)

$py = $null
foreach ($c in @('python', 'py')) {
    $p = Get-Command $c -ErrorAction SilentlyContinue
    if ($p) { $py = $p.Source; break }
}
if ($py) {
    $v = (& $py --version 2>&1) -join ' '
    Line 'Python' "$v ($py)" $true
} else {
    Line 'Python' 'not found - install Python 3.10+' $false
}

$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ff) { $ff = (Get-Command ffprobe -ErrorAction SilentlyContinue).Source }
Line 'FFmpeg' $(if ($ff) { $ff } else { 'not found - needed to assemble video' }) ([bool]$ff)

$ollamaUp = $false
try {
    Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 4 | Out-Null
    $ollamaUp = $true
} catch { }
Line 'Ollama (local LLM)' $(if ($ollamaUp) { 'running on 127.0.0.1:11434' } else { 'not running - start it before the factory' }) $ollamaUp

$comfyUp = $false
try {
    Invoke-RestMethod 'http://127.0.0.1:8188/system_stats' -TimeoutSec 4 | Out-Null
    $comfyUp = $true
} catch { }
Line 'ComfyUI (video gen)' $(if ($comfyUp) { 'running on 127.0.0.1:8188' } else { 'not running - the long factory starts it itself' }) $null

$smi = (Get-Command nvidia-smi -ErrorAction SilentlyContinue).Source
if ($smi) {
    $gpu = (& $smi --query-gpu=name,memory.total,driver_version --format=csv,noheader 2>$null) -join ''
    Line 'GPU' $gpu ([bool]$gpu)
} else {
    Line 'GPU' 'nvidia-smi not found' $null
}

$cs = Get-CimInstance Win32_ComputerSystem
Line 'RAM' ("{0:N1} GB" -f ($cs.TotalPhysicalMemory / 1GB)) $null

$drives = Get-Volume | Where-Object { $_.DriveLetter -and $_.Size -gt 0 }
foreach ($d in $drives) {
    $free = [math]::Round($d.SizeRemaining / 1GB, 1)
    $flag = if ($free -lt 10) { $false } else { $true }
    Line ("Disk {0}:" -f $d.DriveLetter) ("{0} GB free" -f $free) $flag
}

Write-Output '----------------------------------------------------------------'
Write-Output ' Notes:'
Write-Output '  * Everything is generated on this PC: Ollama + ComfyUI + FFmpeg.'
Write-Output '  * The internet is used only to read trends and to upload the video.'
Write-Output '  * Keep 20+ GB free on the working disk before a long run.'
Write-Output '================================================================'
