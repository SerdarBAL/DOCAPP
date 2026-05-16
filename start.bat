@echo off
setlocal
cd /d "%~dp0"

echo === DOCAPP local server ===
echo.

if not exist "node_modules" (
  echo Installing dependencies (one-time) ...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Fix the error above and re-run start.bat.
    pause
    exit /b 1
  )
)

echo Opening browser ...
start "" "http://localhost:5173/DOCAPP/"

echo.
echo Starting Vite dev server on http://localhost:5173/DOCAPP/
echo Press Ctrl+C in this window (or run stop.bat) to stop.
echo.
call npm run dev

endlocal
