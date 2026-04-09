# 简易CRM系统

这是一个基于 Next.js 16 + shadcn/ui 构建的简易客户关系管理系统（CRM），适用于PC端和移动端演示使用。

## 功能特性

### 1. 仪表盘
- 客户、联系人、销售机会统计
- 销售漏斗可视化
- 最近活动记录
- 最近销售机会列表

### 2. 客户管理
- 客户列表（支持搜索和状态筛选）
- 新建/编辑/删除客户
- 客户详情页（查看关联联系人和销售机会）
- 支持PC端表格和移动端卡片两种展示方式

### 3. 销售机会管理
- 机会列表（支持搜索和阶段筛选）
- 完整的销售漏斗阶段（线索 → qualified → 提案 → 谈判 → 成交/失败）
- 新建/编辑/删除销售机会
- 销售漏斗进度可视化

### 4. 联系人管理
- 联系人列表（支持搜索）
- 新建/编辑/删除联系人
- 联系人详情页
- 支持设置主要联系人

### 5. 系统设置
- 通知设置
- 数据管理选项
- 快捷键提示

## 技术栈

- **框架**: Next.js 16 (App Router)
- **UI组件**: shadcn/ui (基于 Radix UI)
- **样式**: Tailwind CSS 4
- **语言**: TypeScript 5
- **状态管理**: React Context + useState

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
# 或者使用 coze dev
```

启动后，在浏览器中打开 http://localhost:5000 查看应用。

### 构建生产版本

```bash
pnpm build
# 或者使用 coze build
```

### 启动生产服务器

```bash
pnpm start
# 或者使用 coze start
```

## 推送到GitHub

如果您还没有克隆仓库，可以使用以下命令：

```bash
# 克隆仓库
git clone https://github.com/Frank-zhao-junjun/CRM.git
cd CRM

# 添加远程仓库（如果需要）
git remote add origin https://github.com/Frank-zhao-junjun/CRM.git

# 推送代码
git push -u origin main
```

## 项目结构

```
src/
├── app/
│   ├── customers/           # 客户管理模块
│   │   ├── [id]/           # 客户详情
│   │   │   └── edit/       # 编辑客户
│   │   └── new/            # 新建客户
│   ├── contacts/           # 联系人管理模块
│   │   ├── [id]/
│   │   │   └── edit/
│   │   └── new/
│   ├── opportunities/      # 销售机会管理模块
│   │   ├── [id]/
│   │   │   └── edit/
│   │   └── new/
│   ├── settings/           # 系统设置
│   └── page.tsx            # 仪表盘
├── components/
│   ├── crm/                # CRM组件
│   │   ├── sidebar.tsx     # 侧边栏
│   │   ├── header.tsx      # 顶部栏
│   │   └── layout.tsx      # CRM布局
│   └── ui/                 # shadcn/ui组件
└── lib/
    ├── crm-context.tsx     # CRM状态管理
    └── crm-types.ts        # 类型定义
```

## 数据说明

这是一个演示系统，所有数据存储在浏览器内存中（React Context）。刷新页面后，数据会重置为初始示例数据。

如需持久化存储，可以集成 Supabase、PostgreSQL 等数据库。

## 响应式设计

系统支持PC端和移动端自适应：
- **PC端**: 使用侧边栏导航 + 表格展示数据
- **移动端**: 使用汉堡菜单 + 卡片展示数据

## License

MIT
