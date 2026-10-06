@echo off
title CakePro Ultimate
color 0A

echo.
echo  ============================================
echo   CakePro Ultimate - Starting...
echo  ============================================
echo.

REM Check if MongoDB service exists and is running
sc query MongoDB >nul 2>&1
if errorlevel 1 (
  echo  [!] MongoDB service not found!
  echo  [!] Please run FIX-PERMANENT.bat as Administrator first
  echo  [!] Then run this file again
  echo.
  pause
  exit /b 1
)

REM Start MongoDB if stopped
sc query MongoDB | find "STOPPED" >nul 2>&1
if not errorlevel 1 (
  echo  [..] Starting MongoDB service...
  net start MongoDB >nul 2>&1
  timeout /t 3 /nobreak >nul
)

sc query MongoDB | find "RUNNING" >nul 2>&1
if errorlevel 1 (
  echo  [X] MongoDB failed to start!
  echo      Run FIX-PERMANENT.bat as Administrator
  pause
  exit /b 1
)

echo  [OK] MongoDB is running
echo.

REM Go to backend folder
cd /d "%~dp0backend"

REM Check if node_modules exists
if not exist "node_modules" (
  echo  [..] Installing packages first time...
  call npm install
  echo.
)

echo  [OK] Starting CakePro server...
echo.
echo  ============================================
echo   Server:   http://localhost:5000
echo   Frontend: Open frontend\index.html
echo              with Live Server in VS Code
echo   Login:    admin / admin123
echo  ============================================
echo.
echo  Keep this window OPEN while using CakePro
echo  Press Ctrl+C to stop the server
echo.

npm run dev
pause
