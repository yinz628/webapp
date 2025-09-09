#!/bin/bash

# 安全更新服务器配置脚本
# 只修改必要的配置，保留原有API路由

echo "🔧 安全更新服务器配置..."

# 备份原始文件
cp server/app.js server/app.js.backup

# 1. 更新CORS配置
sed -i "s/localhost:3000/117.88.59.69:3000/g" server/app.js
sed -i "s/127.0.0.1:3000/117.88.59.69:3000/g" server/app.js

# 2. 更新HOST配置
sed -i "s/const HOST = process.env.HOST || '0.0.0.0'/const HOST = '0.0.0.0'/g" server/app.js

# 3. 添加健康检查接口（如果不存在）
if ! grep -q "/health" server/app.js; then
    # 在启动服务器代码之前添加健康检查接口
    sed -i '/\/\/ 启动服务器/i\\n// 健康检查接口\napp.get("/health", (req, res) => {\n  res.json({\n    status: "ok",\n    timestamp: new Date().toISOString(),\n    server: "117.88.59.69",\n    port: PORT\n  });\n});' server/app.js
fi

# 4. 更新Vite配置中的代理地址
sed -i "s/'http:\/\/localhost:3001'/'http:\/\/117.88.59.69:3001'/g" vite.config.ts

# 5. 更新API服务配置
sed -i "s/localhost:3001/117.88.59.69:3001/g" src/services/userApi.ts
sed -i "s/localhost:3001/117.88.59.69:3001/g" src/services/hanziApi.ts

echo "✅ 服务器配置更新完成"
echo "📋 更新内容："
echo "  - CORS origin 更新为 117.88.59.69:3000"
echo "  - HOST 设置为 0.0.0.0"
echo "  - 添加健康检查接口 /health"
echo "  - API服务地址更新为 117.88.59.69:3001" 