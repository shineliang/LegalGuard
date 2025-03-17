#!/bin/bash

# 初始化数据库
echo "初始化数据库..."
python database/init_db.py

# 启动后端服务
echo "启动后端服务..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..

# 等待后端服务启动
echo "等待后端服务启动..."
sleep 3

# 启动前端服务
echo "启动前端服务..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# 注册退出处理函数
function cleanup {
  echo "关闭服务..."
  kill $BACKEND_PID
  kill $FRONTEND_PID
  exit 0
}

# 捕获SIGINT信号（Ctrl+C）
trap cleanup SIGINT

echo "LegalGuard系统已启动！"
echo "- 前端地址: http://localhost:3000"
echo "- 后端API: http://localhost:5001/api"
echo "按Ctrl+C停止服务"

# 保持脚本运行
wait 