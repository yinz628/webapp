#!/bin/bash

# 汉字学习工具 - 开发环境启动脚本 (Linux/Ubuntu)
# 自动端口清理和服务启动

echo "🚀 汉字学习工具 - 开发环境启动"
echo "=================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 检测到缺少依赖，正在安装..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 运行端口清理
echo "🔧 运行端口清理检查..."
node scripts/port-cleanup.js
if [ $? -ne 0 ]; then
    echo "⚠️  端口清理完成，但可能存在手动处理的端口占用"
fi

echo ""
echo "🎯 启动服务器..."

# 检查是否需要同时启动前后端
read -p "是否要同时启动前端和后端? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 同时启动前端(3000)和后端(3001)服务器..."
    
    # 使用nohup在后台启动后端
    echo "🔄 启动后端服务器..."
    cd server
    nohup node app.js > ../server.log 2>&1 &
    SERVER_PID=$!
    cd ..
    
    # 等待后端启动
    sleep 3
    
    # 检查后端是否启动成功
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "✅ 后端服务器已启动 (PID: $SERVER_PID)"
        echo "📋 后端日志: server.log"
    else
        echo "❌ 后端启动失败，请检查server.log"
        exit 1
    fi
    
    echo ""
    echo "🌐 启动前端开发服务器..."
    echo "📱 前端将在 http://localhost:3000 启动"
    echo "📊 后端API在 http://localhost:3001 运行"
    echo ""
    echo "💡 使用 Ctrl+C 停止前端服务器"
    echo "💡 后端服务器PID: $SERVER_PID (使用 kill $SERVER_PID 停止)"
    echo ""
    
    # 启动前端
    npm run dev
    
    # 前端停止后，询问是否停止后端
    echo ""
    read -p "前端已停止，是否也停止后端服务器? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        kill $SERVER_PID 2>/dev/null
        echo "✅ 后端服务器已停止"
    else
        echo "📊 后端服务器仍在运行 (PID: $SERVER_PID)"
    fi
    
else
    echo "🌐 仅启动前端开发服务器..."
    echo "📱 前端将在 http://localhost:3000 启动"
    echo "⚠️  请确保后端服务器已单独启动在端口3001"
    echo ""
    npm run dev
fi

echo ""
echo "✅ 服务已停止" 