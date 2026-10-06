@echo off
title CakePro - Permanent Fix (Run as Administrator)
color 0A

echo.
echo =====================================================
echo  CakePro Permanent Fix
echo  This makes MongoDB start automatically with Windows
echo  RUN THIS AS ADMINISTRATOR - only needed ONCE
echo =====================================================
echo.

REM Step 1: Create data folders
echo [1] Creating data folders...
if not exist "C:\data\db"  mkdir "C:\data\db"
if not exist "C:\data\log" mkdir "C:\data\log"
echo     Done: C:\data\db and C:\data\log created
echo.

REM Step 2: Remove old broken MongoDB service if exists
echo [2] Removing old MongoDB service...
net stop MongoDB >nul 2>&1
mongod --remove >nul 2>&1
echo     Done
echo.

REM Step 3: Install MongoDB as Windows auto-start service
echo [3] Installing MongoDB as Windows service...
mongod --install ^
  --serviceName "MongoDB" ^
  --serviceDisplayName "MongoDB Server (CakePro)" ^
  --dbpath "C:\data\db" ^
  --logpath "C:\data\log\mongod.log" ^
  --logappend ^
  --serviceDescription "MongoDB database for CakePro Bakery System"

if errorlevel 1 (
  echo.
  echo  ERROR: Could not install service.
  echo  Make sure you right-clicked and chose "Run as administrator"
  echo.
  pause
  exit /b 1
)
echo     Done
echo.

REM Step 4: Set service to auto-start
echo [4] Setting auto-start...
sc config MongoDB start= auto >nul 2>&1
echo     Done
echo.

REM Step 5: Start MongoDB right now
echo [5] Starting MongoDB now...
net start MongoDB
echo.

REM Step 6: Verify
echo [6] Verifying MongoDB is running...
sc query MongoDB | find "RUNNING" >nul 2>&1
if errorlevel 1 (
  echo  WARNING: MongoDB may not have started.
  echo  Try restarting your computer and running START.bat
) else (
  echo     MongoDB is RUNNING!
)

echo.
echo =====================================================
echo  SUCCESS! MongoDB will now:
echo  - Start automatically when Windows starts
echo  - Keep running in the background always
echo  - NEVER lose your data on shutdown/restart
echo.
echo  Your uploaded images are saved in:
echo  %~dp0backend\uploads\
echo  DO NOT delete this folder!
echo =====================================================
echo.
pause
