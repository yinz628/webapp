@echo off
chcp 65001 >nul
title 汉字学习工具 - 开发环境启动

echo 🚀 汉字学习工具 - 开发环境启动
echo ==================================

:: 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

:: 检查npm是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装，请先安装 npm
    pause
    exit /b 1
)

:: 检查依赖是否安装
if not exist "node_modules" (
    echo 📦 检测到缺少依赖，正在安装...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

:: 运行端口清理
echo 🔧 运行端口清理检查...
node scripts/port-cleanup.js
if errorlevel 1 (
    echo ⚠️  端口清理完成，但可能存在手动处理的端口占用
)

echo.
echo 🎯 启动选项:
echo [1] 仅启动前端 (手动启动后端)
echo [2] 同时启动前端和后端
echo [3] 仅启动后端
echo [4] 退出
echo.

set /p choice="请选择 (1-4): "

if "%choice%"=="1" goto start_frontend
if "%choice%"=="2" goto start_both
if "%choice%"=="3" goto start_backend
if "%choice%"=="4" goto exit
goto invalid_choice

:start_frontend
echo 🌐 启动前端开发服务器...
echo 📱 前端将在 http://localhost:3000 启动
echo ⚠️  请确保后端服务器已单独启动在端口3001
echo.
call npm run dev
goto end

:start_backend
echo 📊 启动后端服务器...
echo 📱 后端将在 http://localhost:3001 启动
echo ⚠️  请手动启动前端开发服务器
echo.
cd server
call node app.js
cd ..
goto end

:start_both
echo 📊 同时启动前端(3000)和后端(3001)服务器...
echo 📱 前端: http://localhost:3000
echo 📊 后端: http://localhost:3001
echo.
echo 💡 使用 Ctrl+C 可以同时停止两个服务器
echo.
call npm run start-all-clean
goto end

:invalid_choice
echo ❌ 无效选择，请输入 1-4
pause
goto start

:exit
echo 👋 退出程序
exit /b 0

:end
echo.
echo ✅ 服务已停止
pause 