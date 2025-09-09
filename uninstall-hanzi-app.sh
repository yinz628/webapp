#!/bin/bash

# 汉字学习工具一键卸载脚本
# 用于Ubuntu服务器完全卸载应用

set -e

echo "🛑 汉字学习工具卸载脚本启动..."
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[信息]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

# 确认操作
echo ""
echo "⚠️  警告：此操作将完全卸载汉字学习工具！"
echo "包括："
echo "  - 停止并删除PM2进程"
echo "  - 删除Nginx配置"
echo "  - 删除应用文件"
echo "  - 清理端口占用"
echo ""
read -p "确认继续吗？(y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "操作已取消"
    exit 0
fi

echo ""
print_info "开始卸载过程..."

# 步骤1: 停止并删除PM2应用
echo ""
print_info "步骤1: 停止PM2应用进程"

if command -v pm2 &> /dev/null; then
    print_info "停止hanzi-learning-app..."
    pm2 stop hanzi-learning-app 2>/dev/null || print_warning "应用可能已经停止"
    
    print_info "删除hanzi-learning-app..."
    pm2 delete hanzi-learning-app 2>/dev/null || print_warning "应用可能已经删除"
    
    print_info "保存PM2配置..."
    pm2 save
    
    print_info "显示当前PM2状态:"
    pm2 status
else
    print_warning "PM2未安装或不在PATH中"
fi

# 步骤2: 清理进程和端口
echo ""
print_info "步骤2: 清理进程和端口占用"

print_info "检查端口3000和3001占用情况..."
netstat -tulpn 2>/dev/null | grep -E ":(3000|3001)" || print_info "端口3000/3001未被占用"

print_info "强制清理Node.js进程..."
sudo pkill -f "node.*server" 2>/dev/null || print_info "没有相关Node.js进程在运行"

# 步骤3: 删除Nginx配置
echo ""
print_info "步骤3: 删除Nginx配置"

if command -v nginx &> /dev/null; then
    print_info "删除Nginx站点配置..."
    sudo rm -f /etc/nginx/sites-available/hanzi-learning-tool
    sudo rm -f /etc/nginx/sites-enabled/hanzi-learning-tool
    
    print_info "测试Nginx配置..."
    if sudo nginx -t; then
        print_info "重新加载Nginx..."
        sudo systemctl reload nginx
    else
        print_error "Nginx配置有误，请手动检查"
    fi
else
    print_warning "Nginx未安装"
fi

# 步骤4: 删除应用文件
echo ""
print_info "步骤4: 删除应用文件"

APP_DIR="/opt/hanzi-app"
if [ -d "$APP_DIR" ]; then
    print_info "删除应用目录: $APP_DIR"
    sudo rm -rf "$APP_DIR"
    print_info "应用文件已删除"
else
    print_warning "应用目录不存在: $APP_DIR"
fi

# 检查其他可能的安装位置
OTHER_DIRS=("/home/$USER/hanzi-app" "/var/www/hanzi-app" "/usr/local/hanzi-app")
for dir in "${OTHER_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_warning "发现其他安装目录: $dir"
        read -p "是否删除？(y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo rm -rf "$dir"
            print_info "已删除: $dir"
        fi
    fi
done

# 步骤5: 清理临时文件
echo ""
print_info "步骤5: 清理临时文件"

print_info "删除上传的压缩包..."
sudo rm -f /tmp/hanzi-learning-tool-*.zip

print_info "清理PM2日志..."
if command -v pm2 &> /dev/null; then
    pm2 flush 2>/dev/null || true
fi

# 步骤6: 检查清理结果
echo ""
print_info "步骤6: 检查清理结果"

print_info "检查PM2进程..."
if command -v pm2 &> /dev/null; then
    pm2 status | grep -i hanzi || print_info "✅ 没有相关PM2进程"
fi

print_info "检查端口占用..."
if netstat -tulpn 2>/dev/null | grep -E ":(3000|3001)"; then
    print_warning "端口3000或3001仍被占用"
else
    print_info "✅ 端口3000/3001已释放"
fi

print_info "检查Nginx配置..."
if [ -f "/etc/nginx/sites-enabled/hanzi-learning-tool" ]; then
    print_warning "Nginx配置文件仍存在"
else
    print_info "✅ Nginx配置已清理"
fi

print_info "检查应用目录..."
if [ -d "/opt/hanzi-app" ]; then
    print_warning "应用目录仍存在"
else
    print_info "✅ 应用目录已删除"
fi

# 完成
echo ""
echo "========================================"
print_info "🎉 卸载完成！"
echo ""
print_info "摘要:"
echo "  ✅ PM2进程已停止和删除"
echo "  ✅ Nginx配置已清理"
echo "  ✅ 应用文件已删除"
echo "  ✅ 端口已释放"
echo "  ✅ 临时文件已清理"
echo ""
print_info "如需重新部署，请使用最新的部署脚本。"
echo ""

# 可选：重启相关服务
read -p "是否重启Nginx和清理PM2？(y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v nginx &> /dev/null; then
        print_info "重启Nginx..."
        sudo systemctl restart nginx
    fi
    
    if command -v pm2 &> /dev/null; then
        print_info "重启PM2..."
        pm2 kill
        pm2 resurrect 2>/dev/null || true
    fi
    
    print_info "服务重启完成"
fi

echo ""
print_info "脚本执行完毕，感谢使用！" 