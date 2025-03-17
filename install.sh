#!/bin/bash

# 显示彩色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== LegalGuard 系统安装脚本 ===${NC}"

# 初始化虚拟环境
echo -e "${GREEN}1. 创建和激活Python虚拟环境...${NC}"
python -m venv .venv

# 激活虚拟环境
if [ -f ".venv/bin/activate" ]; then
  source .venv/bin/activate
elif [ -f ".venv/Scripts/activate" ]; then
  source .venv/Scripts/activate
else
  echo "无法找到虚拟环境激活脚本，请手动激活虚拟环境后重试。"
  exit 1
fi

# 安装后端依赖
echo -e "${GREEN}2. 安装后端依赖...${NC}"
# 首先卸载已有的Flask和Werkzeug避免冲突
pip uninstall -y flask werkzeug
# 然后安装所有依赖
cd backend
pip install -r requirements.txt
cd ..

# 初始化数据库
echo -e "${GREEN}3. 初始化数据库...${NC}"
python database/init_db.py

# 安装前端依赖
echo -e "${GREEN}4. 安装前端依赖...${NC}"
cd frontend
npm install
cd ..

# 创建示例.env文件
echo -e "${GREEN}5. 创建环境变量配置文件...${NC}"
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "已创建.env文件，请编辑该文件并添加您的OpenAI API密钥。"
fi

echo -e "${BLUE}=== 安装完成! ===${NC}"
echo "您现在可以运行 ./start.sh 来启动系统。"
echo "- 后端API将运行于: http://localhost:5001/api"
echo "- 前端界面将运行于: http://localhost:3000"
echo -e "${BLUE}====================${NC}" 