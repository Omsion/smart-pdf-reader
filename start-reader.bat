@echo off
chcp 65001 >nul
title Smart PDF Reader

REM ================================================
REM  Smart PDF Reader — 一键启动脚本
REM  自动启动 Next.js 开发服务器并打开浏览器
REM ================================================

set PORT=3000
set URL=http://localhost:%PORT%

echo.
echo ╔══════════════════════════════════════════╗
echo ║      Smart PDF Reader 启动中...         ║
echo ╚══════════════════════════════════════════╝
echo.

REM 检测 %PORT% 端口是否被占用
netstat -ano 2>nul | findstr ":%PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [√] 服务器已在 %PORT% 端口运行，直接打开浏览器...
    start "" %URL%
    goto :end
)

REM 启动 Next.js 开发服务器
echo [→] 正在启动本地服务器...
echo.

REM 获取脚本所在目录（项目根目录）
cd /d "%~dp0"

start "Smart PDF Reader Server" /MIN cmd /c "npm run dev"

REM 等待服务器就绪（轮询检测端口）
echo [→] 等待服务器就绪...
set RETRY=0
:waitloop
timeout /t 1 /nobreak >nul
netstat -ano 2>nul | findstr ":%PORT% " | findstr "LISTENING" >nul
if %errorlevel% equ 0 goto :open
set /a RETRY+=1
if %RETRY% geq 30 (
    echo [×] 超时：服务器未能在 30 秒内启动，请检查是否有错误。
    echo     你可以手动运行 npm run dev 查看详细错误信息。
    pause
    exit /b 1
)
goto :waitloop

:open
echo [√] 服务器已就绪，正在打开浏览器...
start "" %URL%

echo.
echo ╔══════════════════════════════════════════╗
echo ║   Smart PDF Reader 已在浏览器中打开    ║
echo ║   关闭本窗口不会停止服务器              ║
echo ╚══════════════════════════════════════════╝
echo.
echo 提示：在另一个命令行中运行 taskkill /f /im node.exe 可彻底停止服务。

:end
