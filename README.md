# 九州股民助手 - 投资者教育工具平台

九州股民助手是专为A股散户打造的投资者教育工具平台，提供合规的投资知识、数据工具和交流社区，帮助散户提升投资认知，防范投资风险。

## 🌟 核心功能

- **指标筛选工具**：基于公开市场数据，提供市盈率、换手率等指标筛选功能，辅助投资研究
- **投资者课程**：基础投资知识课程，涵盖交易规则、指标解读和风险防范
- **教育中心**：投资风险提示、市场规则解读和投资者权益保护
- **交流社群**：合规的投资者交流社区，分享投资知识和经验

## 🛠️ 技术栈

- **前端框架**：Astro
- **样式系统**：Tailwind CSS
- **数据接口**：Tushare API
- **部署平台**：Vercel

## 🚀 快速开始

### 本地开发

1. 克隆项目
```bash
git clone <项目仓库地址>
cd jiuzhougroup.vip
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件，添加以下内容：
```
TUSHARE_API_KEY=your_api_key
```

4. 启动开发服务器
```bash
npm run dev
```
访问 http://localhost:4321 查看效果

### 构建与部署

1. 构建生产版本
```bash
npm run build
```

2. 本地预览构建结果
```bash
npm run preview
```

3. 部署到 Vercel
直接将代码推送到 GitHub/GitLab 仓库，Vercel 会自动部署

## 📁 项目结构

```text
/jiuzhougroup.vip
├── .gitignore
├── .vscode/
├── README.md
├── astro.config.mjs
├── jsconfig.json
├── package-lock.json
├── package.json
├── postcss.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/         # 可复用组件
│   ├── data/               # 静态数据
│   ├── env.d.ts
│   ├── layouts/            # 页面布局
│   ├── pages/              # 页面文件
│   ├── scripts/            # 数据获取脚本
│   ├── services/           # API服务
│   └── styles/             # 全局样式
├── tailwind.config.js
└── tsconfig.json
```

## ⚠️ 风险提示

本平台仅提供投资知识和工具参考，不构成任何投资建议。股市有风险，投资需谨慎。

## 📞 联系我们

如有问题或建议，请联系客服或加入我们的投资者教育交流群。
