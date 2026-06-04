@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Smart PDF Reader

REM ================================================
REM  Smart PDF Reader — 一键启动脚本
REM  启动服务器 → 打开浏览器 → 按键停止
REM ================================================

set PORT=3000
set URL=http://localhost:%PORT%

echo.
echo ╔══════════════════════════════════════════╗
echo ║      Smart PDF Reader 启动中...         ║
echo ╚══════════════════════════════════════════╝
echo.

REM ── 检测 Node.js ──────────────────────────
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [×] 未检测到 Node.js，请先安装：
    echo     https://nodejs.org （LTS 版本，安装时勾选 Add to PATH）
    pause
    exit /b 1
)

REM ── 切换到项目根目录 ──────────────────────
cd /d "%~dp0"

REM ── 首次运行自动安装依赖 ──────────────────
if not exist "node_modules\" (
    echo [→] 首次运行，正在安装依赖（约 1-2 分钟）...
    call npm install
    if !errorlevel! neq 0 (
        echo [×] 安装失败，请检查网络后重试
        pause
        exit /b 1
    )
    echo [√] 安装完成
    echo.
)

REM ── 检查端口是否已占用 ────────────────────
netstat -ano 2>nul | findstr ":%PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [√] 服务器已在运行，直接打开浏览器...
    start "" !URL!
    goto :running
)

REM ── 启动服务器（关键：/D 指定工作目录）───
echo [→] 正在启动本地服务器...
start "SmartPDF" /D "%~dp0" /MIN cmd /c "npm run dev"

REM ── 轮询等待 + 超时降级 ───────────────────
echo [→] 等待服务器就绪（约 5 秒）...
set RETRY=0
:waitloop
timeout /t 1 /nobreak >nul
set /a RETRY+=1

REM 检测端口是否已监听
netstat -ano 2>nul | findstr ":%PORT% " | findstr "LISTENING" >nul
if !errorlevel! equ 0 goto :open

REM 15 秒后降级：不再死等，直接打开浏览器
if !RETRY! geq 15 goto :open_fallback

goto :waitloop

:open
echo [√] 服务器就绪，正在打开浏览器...
start "" !URL!
goto :running

:open_fallback
echo [!] 正在打开浏览器（如页面未加载请稍等几秒）...
start "" !URL!

REM ── 主窗口保持打开 ────────────────────────
:running
echo.
echo ╔══════════════════════════════════════════╗
echo ║   Smart PDF Reader 使用中               ║
echo ║   使用完毕后，回到这里按任意键退出      ║
echo ╚══════════════════════════════════════════╝
echo.
pause >nul

REM ── 停止服务器 ────────────────────────────
echo.
echo [→] 正在停止服务器...
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    taskkill /pid %%a /f >nul 2>nul
    set FOUND=1
)
if !FOUND! equ 1 (
    echo [√] 服务器已停止
) else (
    echo [√] 服务器已停止（未检测到运行中的进程）
)

timeout /t 2 /nobreak >nul
exit /b 0
