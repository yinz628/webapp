#!/bin/bash

# 设置Nginx反向代理脚本

echo "🌐 设置Nginx反向代理..."

# 检查是否安装了Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 安装Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# 停止可能运行的前端服务
echo "停止前端服务（使用Nginx代替）..."
sudo systemctl stop hanzi-frontend 2>/dev/null || echo "前端服务未运行"
sudo systemctl disable hanzi-frontend 2>/dev/null || echo "前端服务未启用"

# 确保后端服务运行
echo "确保后端服务运行..."
sudo systemctl start hanzi-backend
sudo systemctl enable hanzi-backend

# 创建Nginx配置
echo "创建Nginx配置..."
sudo tee /etc/nginx/sites-available/hanzi-learning > /dev/null << 'EOF'
server {
    listen 80;
    server_name 117.88.59.69;

    # 日志配置
    access_log /var/log/nginx/hanzi-learning.access.log;
    error_log /var/log/nginx/hanzi-learning.error.log;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # 前端应用（Vue构建后的dist目录）
    location / {
        root /opt/hanzi-learning/dist;
        try_files $uri $uri/ /index.html;
        
        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # HTML文件不缓存
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # API代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # CSV文件代理
    location /zici.csv {
        proxy_pass http://127.0.0.1:3001/zici.csv;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # CSV文件缓存1小时
        expires 1h;
        add_header Cache-Control "public";
    }

    # 健康检查接口
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # 限制请求大小
    client_max_body_size 10M;
}
EOF

# 启用站点
echo "启用Nginx站点..."
sudo ln -sf /etc/nginx/sites-available/hanzi-learning /etc/nginx/sites-enabled/

# 删除默认站点（如果存在）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
echo "测试Nginx配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx配置测试通过"
    
    # 重启Nginx
    echo "重启Nginx..."
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    # 更新防火墙规则
    echo "更新防火墙规则..."
    sudo ufw allow 'Nginx Full' || echo "防火墙规则更新完成"
    
    # 关闭不需要的端口（可选）
    # sudo ufw delete allow 3000/tcp
    
    echo ""
    echo "🎉 Nginx配置完成！"
    echo "=================================="
    echo "网站访问: http://117.88.59.69"
    echo "后端API: http://117.88.59.69/api/"
    echo "健康检查: http://117.88.59.69/health"
    echo "=================================="
    echo ""
    echo "📋 Nginx管理命令:"
    echo "重启Nginx: sudo systemctl restart nginx"
    echo "查看状态: sudo systemctl status nginx"
    echo "查看日志: sudo tail -f /var/log/nginx/hanzi-learning.access.log"
    echo "测试配置: sudo nginx -t"
    
else
    echo "❌ Nginx配置测试失败"
    echo "请检查配置文件: /etc/nginx/sites-available/hanzi-learning"
    exit 1
fi 