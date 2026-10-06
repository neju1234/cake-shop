@echo off
title Install MongoDB Windows Service
color 0A
echo.
echo  ==========================================
echo   Installing MongoDB as Windows Service
echo   Run this ONCE as Administrator
echo  ==========================================
echo.
if not exist "C:\data\db"  mkdir "C:\data\db"
if not exist "C:\data\log" mkdir "C:\data\log"
echo  [OK] Data folders ready at C:\data\
net stop MongoDB >nul 2>&1
mongod --remove >nul 2>&1
echo  [..] Installing MongoDB service...
mongod --install --serviceName "MongoDB" --serviceDisplayName "MongoDB Server" --dbpath "C:\data\db" --logpath "C:\data\log\mongod.log" --logappend
echo  [..] Starting MongoDB...
net start MongoDB
echo.
echo  MongoDB installed! Auto-starts with Windows now.
echo.
pause
