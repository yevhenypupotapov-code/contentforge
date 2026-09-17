@echo off
@REM Copyright (c) 2026 Yevhen Potapov. All rights reserved.
setlocal enabledelayedexpansion
title ContentForge - content factory for Windows
cd /d "%~dp0"

:menu
cls
echo ================================================================
echo    ContentForge  -  content factory for Windows
echo    local models only: Ollama + ComfyUI, no cloud generators
echo ================================================================
echo.
echo    [1]  Check this PC  (Python, Ollama, ComfyUI, FFmpeg, GPU)
echo    [2]  Install / update Python packages
   [8]  Auto-download what the factory needs (FFmpeg, Ollama, model)
echo    [3]  Run Shorts factory
echo    [4]  Run long factory
echo    [5]  Open the dashboard (if bundled)
echo    [6]  Read the manual
echo    [7]  Show version and changelog
echo    [0]  Exit
echo.
set /p choice=  Select and press Enter: 

if "%choice%"=="1" call :preflight
if "%choice%"=="2" call :install
if "%choice%"=="8" call :bootstrap
if "%choice%"=="3" call :shorts
if "%choice%"=="4" call :long
if "%choice%"=="5" call :dashboard
if "%choice%"=="6" call :manual
if "%choice%"=="7" call :version
if "%choice%"=="0" goto :end
pause
goto :menu

:preflight
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\preflight.ps1"
goto :eof

:bootstrap
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\bootstrap.ps1"
goto :eof

:install
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\install.ps1"
goto :eof

:shorts
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\run-factory.ps1" -Kind shorts
goto :eof

:long
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\run-factory.ps1" -Kind long
goto :eof

:dashboard
if exist "%~dp0dashboard\index.html" (
  start "" "%~dp0dashboard\index.html"
) else (
  echo.
  echo   Dashboard is not bundled in this package.
  echo   See README.md - the dashboard lives in the contentforge repository.
)
goto :eof

:manual
if exist "%~dp0README.md" start "" notepad "%~dp0README.md"
goto :eof

:version
if exist "%~dp0VERSION" type "%~dp0VERSION"
echo.
if exist "%~dp0CHANGELOG.md" type "%~dp0CHANGELOG.md"
goto :eof

:end
endlocal
