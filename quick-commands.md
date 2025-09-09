# Ubuntu 部署快速命令手册

## 🚀 一键部署命令

```bash
# 1. 上传部署脚本到服务器
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

## 📋 分步骤部署命令

如果一键脚本有问题，可以按以下步骤手动执行：

### 1. 基础环境准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget unzip ufw

# 安装Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 解压和设置项目
```bash
# 进入临时目录
cd /tmp

# 解压文件
unzip -o webapp-main.zip

# 创建生产目录
sudo mkdir -p /opt/hanzi-learning
sudo cp -r webapp-main/* /opt/hanzi-learning/
sudo chown -R $USER:$USER /opt/hanzi-learning
cd /opt/hanzi-learning
```

### 3. 安装依赖和构建
```bash
# 安装依赖
npm install

# 构建前端
npm run build
```

### 4. 配置环境变量
```bash
# 创建.env文件
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
FRONTEND_URL=http://117.88.59.69:3000
VITE_API_BASE_URL=http://117.88.59.69:3001
EOF
```

### 5. 配置防火墙
```bash
# 开启防火墙并允许端口
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

### 6. 手动启动测试
```bash
# 启动后端
cd /opt/hanzi-learning
node server/app.js &

# 启动前端（新终端）
npm run preview -- --host 0.0.0.0 --port 3000 &
```

### 7. 设置自动启动服务
```bash
# 创建后端服务
sudo tee /etc/systemd/system/hanzi-backend.service > /dev/null << 'EOF'
[Unit]
Description=汉字学习工具后端服务
After=network.target

[Service]
Type=simple
User=ubuntu
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

# 创建前端服务
sudo tee /etc/systemd/system/hanzi-frontend.service > /dev/null << 'EOF'
[Unit]
Description=汉字学习工具前端服务
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/hanzi-learning
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable hanzi-backend hanzi-frontend
sudo systemctl start hanzi-backend hanzi-frontend
```

## 🔍 常用管理命令

### 服务管理
```bash
# 查看服务状态
sudo systemctl status hanzi-backend
sudo systemctl status hanzi-frontend

# 重启服务
sudo systemctl restart hanzi-backend
sudo systemctl restart hanzi-frontend

# 停止服务
sudo systemctl stop hanzi-backend
sudo systemctl stop hanzi-frontend

# 查看服务日志
sudo journalctl -u hanzi-backend -f
sudo journalctl -u hanzi-frontend -f
```

### 调试命令
```bash
# 检查端口占用
netstat -tlnp | grep 3000
netstat -tlnp | grep 3001

# 检查防火墙状态
sudo ufw status

# 测试后端API
curl http://117.88.59.69:3001/health

# 检查进程
ps aux | grep node
```

### 更新部署
```bash
# 停止服务
sudo systemctl stop hanzi-backend hanzi-frontend

# 备份当前版本
sudo cp -r /opt/hanzi-learning /opt/hanzi-learning.backup.$(date +%Y%m%d_%H%M%S)

# 更新代码
cd /tmp
unzip -o webapp-main-new.zip
sudo cp -r webapp-main/* /opt/hanzi-learning/

# 重新构建
cd /opt/hanzi-learning
npm install
npm run build

# 重启服务
sudo systemctl start hanzi-backend hanzi-frontend
```

## 🔧 故障排除

### 如果端口被占用
```bash
# 查找占用端口的进程
sudo lsof -i :3000
sudo lsof -i :3001

# 终止进程
sudo kill -9 PID

# 重启服务
sudo systemctl restart hanzi-backend hanzi-frontend
```

### 如果服务启动失败
```bash
# 查看详细错误日志
sudo journalctl -u hanzi-backend -n 50
sudo journalctl -u hanzi-frontend -n 50

# 检查文件权限
ls -la /opt/hanzi-learning
sudo chown -R $USER:$USER /opt/hanzi-learning
```

### 如果访问被拒绝
```bash
# 检查防火墙
sudo ufw status verbose

# 重新配置防火墙
sudo ufw delete allow 3000/tcp
sudo ufw delete allow 3001/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

## 📱 最终测试

部署完成后，访问以下地址验证：

- 前端应用: http://117.88.59.69:3000
- 后端API: http://117.88.59.69:3001/health
- API测试: http://117.88.59.69:3001/api/users 