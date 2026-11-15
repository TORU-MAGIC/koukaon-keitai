@echo off
setlocal
title Magic Show Cue - Simple Effect Remote
cd /d "%~dp0"

echo Starting the simple effect remote for iPhone / PC...
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0mobile-server.ps1" -Port 8080

if errorlevel 1 (
  echo.
  echo Startup failed. Check the error message above.
  pause
)

endlocal
