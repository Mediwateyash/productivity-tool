@echo off
title Productivity - Installer
color 0b

echo =========================================================
echo    ⚡ WELCOME TO PRODUCTIVITY INSTALLATION ⚡
echo =========================================================
echo.
echo [1/3] Verifying Node.js environment installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Node.js was not detected on this system!
    echo Node.js is required to install dependencies and run the servers.
    echo.
    echo 💡 INSTRUCTIONS:
    echo 1. Download and install Node.js from: https://nodejs.org/
    echo 2. Rerun this installer after installation is complete.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Node.js detected:
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo NodeJS Version: %NODE_VER%
echo.

echo =========================================================
echo [2/3] Installing MERN workspace packages...
echo This may take a few minutes. Please wait...
echo =========================================================
echo.

call npm run install-all

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Installation failed during dependency check!
    echo Please make sure your internet connection is active and try again.
    echo.
    pause
    exit /b 1
)

echo.
echo =========================================================
echo [3/3] Completing setup...
echo =========================================================
echo.
echo  ⚡ SUCCESS: Productivity installed successfully! ⚡
echo.
echo  📂 All node_modules and structural dependencies are configured.
echo  🚀 You can now launch and run your MERN command center.
echo.
echo  👉 INSTRUCTIONS TO RUN:
echo     Double-click 'Launch.exe' inside this folder to auto-start!
echo.
echo =========================================================
pause
