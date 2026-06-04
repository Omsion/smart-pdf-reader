@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>nul
title Smart PDF Reader

set PORT=3000
set URL=http://localhost:!PORT!

echo.
echo ================================================
echo       Smart PDF Reader
echo ================================================
echo.

where npm >nul 2>nul
if !errorlevel! neq 0 (
    echo [X] Node.js not found
    echo     Please install from https://nodejs.org
    echo     Check: Add to PATH during installation
    pause
    exit /b 1
)

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [>>] First run: installing dependencies...
    call npm install
    if !errorlevel! neq 0 (
        echo [X] Install failed, check network
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
    echo.
)

netstat -ano 2>nul | findstr ":!PORT! " | findstr "LISTENING" >nul
if !errorlevel! equ 0 (
    echo [OK] Server already running, opening browser...
    start "" !URL!
    goto :running
)

echo [>>] Starting local server...
start "SmartPDF" /D "%~dp0" /MIN cmd /c "npm run dev"

echo [>>] Waiting for server to be ready...
set RETRY=0
:waitloop
timeout /t 1 /nobreak >nul
set /a RETRY+=1

netstat -ano 2>nul | findstr ":!PORT! " | findstr "LISTENING" >nul
if !errorlevel! equ 0 goto :open

if !RETRY! geq 15 goto :open
goto :waitloop

:open
echo [OK] Server ready, opening browser...
start "" !URL!

:running
echo.
echo ================================================
echo   Smart PDF Reader is running
echo   Close browser, then press any key here to stop
echo ================================================
echo.
pause >nul

echo.
echo [>>] Stopping server...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":!PORT! " ^| findstr "LISTENING"') do (
    taskkill /pid %%a /f >nul 2>nul
)
echo [OK] Server stopped
timeout /t 2 /nobreak >nul
exit /b 0
