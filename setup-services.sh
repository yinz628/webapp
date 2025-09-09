#!/bin/bash

# 设置systemd服务脚本

echo "🔧 设置系统服务..."

# 停止可能运行的手动进程
echo "停止手动启动的进程..."
pkill -f "node server/app.js" || echo "没有找到手动启动的后端进程"

# 创建后端服务
echo "创建后端服务..."
sudo tee /etc/systemd/system/hanzi-backend.service > /dev/null << EOF
[Unit]
Description=汉字学习工具后端服务
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/hanzi-learning
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=HOST=0.0.0.0
ExecStart=/usr/bin/node server/app.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 创建前端服务
echo "创建前端服务..."
sudo tee /etc/systemd/system/hanzi-frontend.service > /dev/null << EOF
[Unit]
Description=汉字学习工具前端服务
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/hanzi-learning
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 3000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd配置
echo "重新加载systemd配置..."
sudo systemctl daemon-reload

# 启用服务
echo "启用服务..."
sudo systemctl enable hanzi-backend
sudo systemctl enable hanzi-frontend

# 启动服务
echo "启动服务..."
sudo systemctl start hanzi-backend
sudo systemctl start hanzi-frontend

# 等待启动
sleep 5

# 检查服务状态
echo ""
echo "🔍 检查服务状态..."
echo "=================================="

echo "后端服务状态:"
sudo systemctl status hanzi-backend --no-pager -l

echo ""
echo "前端服务状态:"
sudo systemctl status hanzi-frontend --no-pager -l

# 测试连接
echo ""
echo "🧪 测试服务连接..."
if curl -s http://127.0.0.1:3001/health > /dev/null; then
    echo "✅ 后端服务正常"
else
    echo "❌ 后端服务异常"
fi

if curl -s http://127.0.0.1:3000 > /dev/null; then
    echo "✅ 前端服务正常"
else
    echo "❌ 前端服务异常"
fi

echo ""
echo "🎉 系统服务设置完成！"
echo "=================================="
echo "前端访问: http://117.88.59.69:3000"
echo "后端API: http://117.88.59.69:3001"
echo "健康检查: http://117.88.59.69:3001/health"
echo "=================================="
echo ""
echo "📋 服务管理命令:"
echo "查看后端日志: sudo journalctl -u hanzi-backend -f"
echo "查看前端日志: sudo journalctl -u hanzi-frontend -f"
echo "重启后端: sudo systemctl restart hanzi-backend"
echo "重启前端: sudo systemctl restart hanzi-frontend"
echo "停止服务: sudo systemctl stop hanzi-backend hanzi-frontend"
echo "查看状态: sudo systemctl status hanzi-backend hanzi-frontend" 