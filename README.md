# 简易 CRM 系统

基于 Next.js 16、TypeScript、shadcn/ui 和 Supabase 的 CRM 演示项目，覆盖客户、联系人、线索、商机、报价、合同、订单、发票、任务、报表与自动化等核心业务模块。

适用场景：
- CRM 产品原型演示
- 销售流程管理系统实践
- Next.js + Supabase 业务后台项目参考

## 项目亮点

- 完整 CRM 业务链路：客户、联系人、线索、商机到订单、合同、发票与回款
- 报表与 BI：销售漏斗、团队排行、收入预测、转化分析、BI 仪表盘
- 自动化能力：邮件模板、销售序列、任务联动、活动追踪
- 权限控制：基于角色的 RBAC 权限体系，覆盖 API 和 UI
- 响应式体验：支持桌面端和移动端展示

## 主要模块

### 销售与客户
- 客户管理
- 联系人管理
- 销售线索管理
- 商机与销售漏斗
- 跟进与活动时间线

### 交易与履约
- 报价单管理
- 合同管理
- 订单管理
- 发票管理
- 回款管理

### 效率与运营
- 全局搜索
- 日历视图
- 任务管理
- 邮件集成
- 销售自动化序列
- 数据导入导出

### 管理与分析
- RBAC 权限管理
- 报表中心
- BI 仪表盘
- 系统设置

## 技术栈

- 框架：Next.js 16 App Router
- 语言：TypeScript 5
- UI：shadcn/ui + Radix UI
- 样式：Tailwind CSS 4
- 图表：Recharts
- 表单：React Hook Form + Zod
- 数据库：Supabase PostgreSQL
- 测试：Vitest
- 包管理：pnpm

## 快速开始

### 环境要求

- Node.js >= 22.12.0
- pnpm >= 9.15.0

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env.local`，至少配置：

```env
COZE_SUPABASE_URL=your_supabase_url
COZE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 启动开发环境

```bash
pnpm dev
```

启动后访问 http://localhost:5000

### 构建与启动生产环境

```bash
pnpm build
pnpm start
```

## 常用命令

```bash
pnpm dev
pnpm lint
pnpm test
pnpm ts-check
pnpm build
pnpm check
```

## 项目结构

```text
src/
├── app/                    # 页面与 API 路由
├── components/             # 业务组件与通用 UI 组件
├── domain/                 # DDD 领域层
├── hooks/                  # 自定义 Hooks
├── lib/                    # 共享工具、数据访问与权限逻辑
├── storage/                # 数据库存储定义
└── types/                  # 类型声明

supabase/
└── migrations/             # 数据库迁移脚本
```

## 当前版本能力

- V5.0：数据分析与 BI 仪表盘
- V4.4：销售自动化序列
- V4.3：RBAC 权限管理
- V4.2：邮件集成与活动追踪
- V4.1：任务管理与全局搜索
- V4.0：看板视图与高级报表

## 说明

- 当前仓库为演示项目，默认面向本地开发和方案展示
- 数据持久化依赖 Supabase 配置
- 当前仓库未保留平台发布预设配置
- 如果用于生产环境，建议自行补充鉴权、审计、监控和 CI/CD 流程

## License

MIT
