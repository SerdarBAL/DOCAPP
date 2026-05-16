@echo off
setlocal
cd /d "%~dp0"

echo === DOCAPP deploy to GitHub Pages ===
echo.

REM 1) Mirror the on-disk slice folders into public/slices/ so Vite ships them
REM    as static assets. /MIR removes anything that no longer exists on disk.
echo [1/4] Mirroring slice folders into public/slices/ ...
if not exist "public\slices" mkdir "public\slices"
robocopy "1_Low_Dose_Input"   "public\slices\ldct" *.png /MIR /NJH /NJS /NDL /NP /NFL >nul
robocopy "2_Model_Prediction" "public\slices\pred" *.png /MIR /NJH /NJS /NDL /NP /NFL >nul
robocopy "3_Full_Dose_Target" "public\slices\fdct" *.png /MIR /NJH /NJS /NDL /NP /NFL >nul
echo     done.

REM 2) Make sure deps + gh-pages are installed.
if not exist "node_modules" (
  echo [2/4] Installing dependencies ...
  call npm install
) else (
  echo [2/4] Dependencies already installed.
)
call npm ls gh-pages >nul 2>&1
if errorlevel 1 (
  echo     Installing gh-pages ...
  call npm install --save-dev gh-pages
)

REM 3) Build the production bundle.
echo [3/4] Building production bundle ...
call npm run build
if errorlevel 1 (
  echo Build failed. Aborting.
  pause
  exit /b 1
)

REM 4) Publish dist/ to the gh-pages branch.
echo [4/4] Publishing dist/ to gh-pages branch ...
call npx gh-pages -d dist -b gh-pages
if errorlevel 1 (
  echo gh-pages publish failed. Make sure this folder is a git repo
  echo with a GitHub remote, e.g.:
  echo     git init
  echo     git remote add origin https://github.com/^<user^>/DOCAPP.git
  pause
  exit /b 1
)

echo.
echo === Done. Your site will be live at:
echo     https://^<your-github-username^>.github.io/DOCAPP/
echo.
echo Reminder: in your repo settings, set Pages source to the
echo gh-pages branch (root). First deploy can take 1-2 minutes.
endlocal
