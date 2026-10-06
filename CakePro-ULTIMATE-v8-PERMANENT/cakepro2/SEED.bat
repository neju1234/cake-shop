@echo off
title CakePro - Seed Database
color 0A
echo.
echo  ==========================================
echo   CakePro - Seeding Database
echo  ==========================================
echo.
echo  [1] Starting MongoDB...
if not exist "C:\data\db" mkdir "C:\data\db"
sc query MongoDB | find "RUNNING" >nul 2>&1
if errorlevel 1 (
    net start MongoDB >nul 2>&1
    if errorlevel 1 (
        start /min "MongoDB" mongod --dbpath "C:\data\db"
    )
    timeout /t 4 /nobreak >nul
)
echo  [OK] MongoDB ready
echo.
echo  [2] Running seed...
cd /d "%~dp0backend"
node seed.js
echo.
echo  Seed complete! Now run START.bat
echo.
pause
