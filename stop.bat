@echo off
setlocal enabledelayedexpansion
echo === Stopping Vite dev server on port 5173 ===

set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr LISTENING') do (
  set FOUND=1
  echo Killing PID %%a ...
  taskkill /F /PID %%a >nul 2>&1
)

if !FOUND! == 0 (
  echo No process is listening on port 5173. Nothing to stop.
) else (
  echo Done.
)
endlocal
