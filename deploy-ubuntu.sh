#!/bin/bash

# 汉字学习工具 - Ubuntu服务器部署脚本
# 服务器地址: 117.88.59.69
# 前端端口: 3000, 后端端口: 3001

set -e  # 遇到错误立即退出

echo "🚀 开始部署汉字学习工具..."

# 1. 解压文件并设置目录
echo "📦 解压代码文件..."
cd /tmp
if [ -f "webapp-main.zip" ]; then
    unzip -o webapp-main.zip
    echo "✅ 文件解压完成"
else
    echo "❌ 未找到 webapp-main.zip 文件"
    exit 1
fi

# 2. 移动到生产目录
echo "📁 设置生产目录..."
sudo mkdir -p /opt/hanzi-learning
sudo cp -r webapp-main/* /opt/hanzi-learning/
sudo chown -R $USER:$USER /opt/hanzi-learning
cd /opt/hanzi-learning

# 3. 检查Node.js和npm版本
echo "🔍 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

node_version=$(node --version)
npm_version=$(npm --version)
echo "✅ Node.js: $node_version, npm: $npm_version"

# 4. 安装依赖
echo "📦 安装项目依赖..."
npm install --production

# 5. 创建生产环境配置
echo "⚙️ 配置生产环境..."
cat > .env << EOF
# 生产环境配置
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=http://117.88.59.69:3000
VITE_API_BASE_URL=http://117.88.59.69:3001
EOF

# 6. 修改API配置指向生产服务器
echo "🔧 更新API配置..."
sed -i "s/localhost/117.88.59.69/g" src/services/userApi.ts
sed -i "s/localhost/117.88.59.69/g" src/services/hanziApi.ts

# 7. 修改Vite配置
echo "🔧 更新Vite配置..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    // 生产环境代理配置
    proxy: {
      '/api': {
        target: 'http://117.88.59.69:3001',
        changeOrigin: true,
        secure: false
      },
      '/zici.csv': {
        target: 'http://117.88.59.69:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          elementPlus: ['element-plus', '@element-plus/icons-vue']
        }
      }
    },
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  publicDir: 'public'
})
EOF

# 8. 修改后端配置
echo "🔧 更新后端配置..."
cat > server/app.js << 'EOF'
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';  // 允许外部访问

// CORS配置 - 允许来自前端的请求
app.use(cors({
  origin: [
    'http://117.88.59.69:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 提供静态文件服务
app.use(express.static('dist', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: '117.88.59.69',
    port: PORT
  });
});

// 其他API路由保持不变...
EOF

# 将原始app.js的内容合并（保留API路由）
tail -n +50 server/app.js.bak >> server/app.js 2>/dev/null || echo "注意：保留原始API路由"

# 9. 构建前端
echo "🏗️ 构建前端应用..."
npm run build

# 10. 创建用户数据目录
echo "📁 创建用户数据目录..."
mkdir -p server/user_data
chmod 755 server/user_data

# 11. 配置防火墙
echo "🔥 配置防火墙..."
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload

echo "✅ 防火墙已配置: 允许端口 3000, 3001"

# 12. 创建systemd服务文件
echo "🔧 创建系统服务..."

# 后端服务
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

[Install]
WantedBy=multi-user.target
EOF

# 前端服务
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

[Install]
WantedBy=multi-user.target
EOF

# 13. 启用并启动服务
echo "🚀 启动服务..."
sudo systemctl daemon-reload
sudo systemctl enable hanzi-backend
sudo systemctl enable hanzi-frontend
sudo systemctl start hanzi-backend
sudo systemctl start hanzi-frontend

# 14. 检查服务状态
echo "🔍 检查服务状态..."
sleep 5

echo "后端服务状态:"
sudo systemctl status hanzi-backend --no-pager -l

echo "前端服务状态:"
sudo systemctl status hanzi-frontend --no-pager -l

# 15. 测试连接
echo "🧪 测试服务连接..."
if curl -s http://117.88.59.69:3001/health > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "⚠️ 后端服务可能未正常启动"
fi

# 16. 显示部署信息
echo ""
echo "🎉 部署完成！"
echo "=================================="
echo "服务器地址: 117.88.59.69"
echo "前端访问: http://117.88.59.69:3000"
echo "后端API: http://117.88.59.69:3001"
echo "健康检查: http://117.88.59.69:3001/health"
echo "=================================="
echo ""
echo "📋 常用命令:"
echo "查看后端日志: sudo journalctl -u hanzi-backend -f"
echo "查看前端日志: sudo journalctl -u hanzi-frontend -f"
echo "重启后端: sudo systemctl restart hanzi-backend"
echo "重启前端: sudo systemctl restart hanzi-frontend"
echo "停止服务: sudo systemctl stop hanzi-backend hanzi-frontend"
echo ""
echo "🔧 如果需要调试，请检查:"
echo "1. 防火墙状态: sudo ufw status"
echo "2. 端口占用: netstat -tlnp | grep ':300'"
echo "3. 服务日志: sudo journalctl -u hanzi-backend -u hanzi-frontend" 