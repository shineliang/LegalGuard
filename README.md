# LegalGuard - 劳动法规合规智能监控系统

LegalGuard是一个智能化的劳动法规监控和解读平台，帮助企业和个人轻松掌握最新劳动法规动态，确保合规运营。

## 功能特点

- **法规爬取**：自动从人力资源和社会保障部网站爬取最新劳动法规
- **法规时间轴**：按照时间顺序展示法规变化历程
- **智能解读**：利用LLM技术对法规进行智能解读，提供通俗易懂的解释
- **全文搜索**：支持对法规内容进行全文搜索
- **美观界面**：现代化的用户界面，提供良好的用户体验

## 技术栈

- **前端**：React, Ant Design, React Router
- **后端**：Python Flask
- **数据库**：SQLite3
- **爬虫**：Requests, BeautifulSoup4
- **AI集成**：OpenAI API

## 开始使用

### 环境要求

- Python 3.8+
- Node.js 14+
- npm 6+
- Git

### 获取代码

```bash
# 克隆仓库
git clone https://github.com/[your-username]/LegalGuard.git
cd LegalGuard

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入必要的配置信息
```

### 快速安装（推荐）

使用我们提供的安装脚本进行一键安装：

```bash
# 给安装脚本添加执行权限
chmod +x install.sh

# 运行安装脚本
./install.sh
```

安装完成后，运行启动脚本：

```bash
./start.sh
```

### 手动安装

如果您希望手动安装各个组件，请按照以下步骤操作：

#### 后端设置

1. 创建并激活虚拟环境：

```bash
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# 或者
.venv\Scripts\activate     # Windows
```

2. 安装Python依赖：

```bash
cd backend
pip install -r requirements.txt
```

3. 初始化数据库：

```bash
python database/init_db.py
```

4. 启动后端服务：

```bash
python backend/app.py
```

#### 前端设置

1. 安装Node.js依赖：

```bash
cd frontend
npm install
```

2. 启动前端开发服务器：

```bash
npm start
```

## 使用方法

1. 访问系统：打开浏览器，访问 `http://localhost:3000`
2. 爬取法规：进入"管理"页面，点击"开始爬取"按钮
3. 浏览法规：在"法规库"页面查看所有法规
4. 查看时间轴：在"时间轴"页面按时间顺序查看法规
5. 获取解读：在法规详情页面，切换到"智能解读"标签，点击"生成智能解读"

## 项目结构

```
LegalGuard/
├── backend/               # 后端代码
│   ├── app.py             # Flask应用主文件
│   ├── llm_integration.py # LLM集成模块
│   ├── requirements.txt   # 后端依赖
│   └── scrapers/          # 爬虫模块
├── database/              # 数据库相关
│   ├── init_db.py         # 数据库初始化
│   ├── schema.sql         # 数据库结构
│   └── db_operations.py   # 数据库操作
├── frontend/              # 前端代码
│   ├── public/            # 静态资源
│   └── src/               # React源代码
│       ├── pages/         # 页面组件
│       └── services/      # API服务
├── .env.example           # 环境变量示例
├── .gitignore            # Git忽略文件配置
├── install.sh            # 安装脚本
├── start.sh              # 启动脚本
└── CHANGELOG.md          # 更新日志
```

## 开发指南

### Git 工作流

1. 创建新分支进行开发：
```bash
git checkout -b feature/your-feature-name
```

2. 提交更改：
```bash
git add .
git commit -m "feat: 添加新功能描述"
```

3. 推送到远程仓库：
```bash
git push origin feature/your-feature-name
```

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构代码
- `test`: 添加测试
- `chore`: 构建过程或辅助工具的变动

## 许可证

MIT

## 联系方式

如有任何问题或建议，请提交Issue或联系开发者。 