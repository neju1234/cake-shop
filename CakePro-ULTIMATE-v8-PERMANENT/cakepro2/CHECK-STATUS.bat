@echo off
title CakePro - Status Check
color 0B

echo.
echo  ============================================
echo   CakePro System Status Check
echo  ============================================
echo.

REM Check MongoDB service
echo  [MongoDB Service]
sc query MongoDB >nul 2>&1
if errorlevel 1 (
  echo   STATUS: NOT INSTALLED
  echo   FIX:    Run FIX-PERMANENT.bat as Administrator
) else (
  sc query MongoDB | find "RUNNING" >nul 2>&1
  if errorlevel 1 (
    echo   STATUS: STOPPED
    echo   FIX:    Run FIX-PERMANENT.bat as Administrator
  ) else (
    echo   STATUS: RUNNING OK
  )
)
echo.

REM Check data folder
echo  [Data Folder]
if exist "C:\data\db" (
  echo   C:\data\db  EXISTS OK
) else (
  echo   C:\data\db  MISSING - Run FIX-PERMANENT.bat
)
echo.

REM Check uploads folder
echo  [Uploads Folder]
set UPLOADS=%~dp0backend\uploads
if exist "%UPLOADS%" (
  echo   Folder: %UPLOADS%
  dir "%UPLOADS%" /b 2>nul | find /c /v "" > tmp_count.txt
  set /p IMGCOUNT=<tmp_count.txt
  del tmp_count.txt >nul 2>&1
  echo   Images: %IMGCOUNT% file(s) saved
) else (
  echo   MISSING - Will be created when server starts
)
echo.

REM Check Node.js
echo  [Node.js]
node --version >nul 2>&1
if errorlevel 1 (
  echo   NOT INSTALLED
) else (
  for /f %%v in ('node --version') do echo   Version: %%v  OK
)
echo.

REM Check MongoDB
echo  [MongoDB]
mongod --version >nul 2>&1
if errorlevel 1 (
  echo   NOT INSTALLED
) else (
  for /f "tokens=3" %%v in ('mongod --version ^| findstr "version"') do echo   Version: %%v  OK
)
echo.

echo  ============================================
echo   If anything shows NOT OK or MISSING:
echo   Run FIX-PERMANENT.bat as Administrator
echo  ============================================
echo.
pause
