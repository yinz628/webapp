#!/bin/bash

# 汉字学习工具 - 简化版Ubuntu部署脚本
# 服务器: 117.88.59.69, 前端:3000, 后端:3001

set -e

echo "🚀 开始部署汉字学习工具（简化版）"
echo "服务器地址: 117.88.59.69"
echo "前端端口: 3000"
echo "后端端口: 3001"
echo ""

# 1. 检查文件
echo "📦 检查上传的文件..."
if [ ! -f "/tmp/webapp-main.zip" ]; then
    echo "❌ 未找到 /tmp/webapp-main.zip 文件"
    echo "请确保已将文件上传到 /tmp/webapp-main.zip"
    exit 1
fi

# 2. 解压文件
echo "📂 解压文件..."
cd /tmp
unzip -o webapp-main.zip
ls -la webapp-main/

# 3. 移动到生产目录
echo "📁 设置生产目录..."
sudo mkdir -p /opt/hanzi-learning
sudo cp -r webapp-main/* /opt/hanzi-learning/
sudo chown -R $USER:$USER /opt/hanzi-learning
cd /opt/hanzi-learning

# 4. 安装依赖
echo "📦 安装依赖..."
npm install

# 5. 创建环境配置
echo "⚙️ 创建生产环境配置..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=http://117.88.59.69:3000
VITE_API_BASE_URL=http://117.88.59.69:3001
EOF

# 6. 使用安全的配置更新脚本
echo "🔧 更新服务器配置..."
chmod +x update-server-config.sh
./update-server-config.sh

# 7. 构建前端
echo "🏗️ 构建前端..."
npm run build

# 8. 创建用户数据目录
echo "📁 创建用户数据目录..."
mkdir -p server/user_data
chmod 755 server/user_data

# 9. 配置防火墙
echo "🔥 配置防火墙..."
sudo ufw allow 3000/tcp || echo "端口3000已开放或防火墙未启用"
sudo ufw allow 3001/tcp || echo "端口3001已开放或防火墙未启用"

# 10. 测试手动启动
echo "🧪 测试手动启动..."
echo "启动后端服务..."
nohup node server/app.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "后端PID: $BACKEND_PID"

sleep 3

# 检查后端是否启动成功
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ 后端启动成功"
    
    # 测试健康检查
    if curl -s http://127.0.0.1:3001/health > /dev/null; then
        echo "✅ 健康检查通过"
    else
        echo "⚠️ 健康检查失败，但服务可能仍在启动中"
    fi
else
    echo "❌ 后端启动失败，查看日志:"
    cat backend.log
    exit 1
fi

echo ""
echo "🎉 基础部署完成！"
echo "=================================="
echo "服务器地址: 117.88.59.69"
echo "后端API: http://117.88.59.69:3001"
echo "健康检查: http://117.88.59.69:3001/health"
echo "=================================="
echo ""
echo "📋 下一步操作:"
echo "1. 测试后端API: curl http://117.88.59.69:3001/health"
echo "2. 如果测试通过，运行: ./setup-services.sh 设置自动启动"
echo "3. 或者运行: ./setup-nginx.sh 配置Nginx反向代理"
echo ""
echo "🔍 当前状态:"
echo "后端进程ID: $BACKEND_PID"
echo "后端日志: tail -f backend.log"
echo "停止后端: kill $BACKEND_PID" 