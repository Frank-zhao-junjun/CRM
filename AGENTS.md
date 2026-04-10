# 简易 CRM 系统 - 设计文档

## 项目概览

基于 Next.js 16 + shadcn/ui 的简易客户关系管理系统，支持仪表盘、客户管理、销售机会管理和联系人管理。集成 Supabase PostgreSQL 数据库实现数据持久化。

---

## 目录

1. [技术架构设计](#1-技术架构设计)
2. [数据流与状态管理](#2-数据流与状态管理)
3. [UI/UX 设计](#3-ux-设计)
4. [页面原型](#4-页面原型)
5. [交互流程](#5-交互流程)
6. [V2.1 删除/编辑功能详细方案](#6-v21-删除编辑功能详细方案)
7. [部署方案](#7-部署方案)

---

## 1. 技术架构设计

### 1.1 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端框架 | Next.js 16 (App Router) | SSR/SSG 支持，API Routes |
| UI 组件库 | shadcn/ui | 基于 Radix UI，Tailwind CSS |
| 状态管理 | React Context + SWR 模式 | useCRM Hook 统一管理 |
| 后端 API | Next.js API Routes | `/api/crm` 统一接口 |
| 数据库 | Supabase PostgreSQL | 托管式 PostgreSQL |
| ORM/SDK | Supabase JS SDK | HTTP 协议数据操作 |

### 1.2 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Next.js App Router                    │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │    │
│  │  │Dashboard│  │Customers│  │Opportun.│  │Contacts │   │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │    │
│  │       └────────────┼────────────┼────────────┘        │    │
│  │                    ▼                                    │    │
│  │            ┌──────────────┐                             │    │
│  │            │ CRMProvider  │                             │    │
│  │            │  (Context)   │                             │    │
│  │            └──────┬───────┘                             │    │
│  └───────────────────┼─────────────────────────────────────┘    │
└──────────────────────┼──────────────────────────────────────────┘
                       │ fetch / mutations
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     /api/crm                                │  │
│  │  GET  ?type=customers|contacts|opportunities|stats|activities│  │
│  │  POST  {action, data} - 创建                                │  │
│  │  PUT   {action, id, data} - 更新                           │  │
│  │  DELETE ?action=&id= - 删除                                 │  │
│  └───────────────────────────┬────────────────────────────────┘  │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTP
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Supabase Cloud                              │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │    PostgreSQL       │    │   Row Level Security │             │
│  │  ┌───────────────┐  │    │   Policy: 公开读写   │             │
│  │  │  customers    │  │    │   (当前无 Auth)     │             │
│  │  │  contacts     │  │    └─────────────────────┘             │
│  │  │  opportunities│  │                                         │
│  │  │  activities  │  │                                         │
│  │  └───────────────┘  │                                         │
│  └─────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 数据库 Schema

```sql
-- 客户表
CREATE TABLE customers (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'prospect',  -- active, inactive, prospect
  industry VARCHAR(100),
  website VARCHAR(500),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 联系人表
CREATE TABLE contacts (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(64) NOT NULL,
  last_name VARCHAR(64) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(128),
  customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 销售机会表
CREATE TABLE opportunities (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  customer_id VARCHAR(36) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_id VARCHAR(36) REFERENCES contacts(id) ON DELETE SET NULL,
  value NUMERIC(15, 2) NOT NULL DEFAULT '0',
  stage VARCHAR(20) NOT NULL DEFAULT 'lead',
  probability INTEGER NOT NULL DEFAULT 10,
  expected_close_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 活动记录表
CREATE TABLE activities (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,      -- created, updated, deleted, stage_change
  entity_type VARCHAR(50) NOT NULL, -- customer, contact, opportunity
  entity_id VARCHAR(36) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

---

## 2. 数据流与状态管理

### 2.1 CRM Context 结构

```typescript
interface CRMContextType {
  // 数据状态
  customers: Customer[];
  contacts: Contact[];
  opportunities: Opportunity[];
  activities: Activity[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  
  // 操作方法
  refreshData: () => Promise<void>;
  
  // Customer CRUD
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Contact CRUD
  addContact: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  
  // Opportunity CRUD
  addOpportunity: (data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
}
```

### 2.2 数据流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户交互                                  │
│    点击删除按钮 ───► 确认对话框 ───► 确认删除                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CRMContext                                  │
│  1. setLoading(true)                                           │
│  2. 调用 deleteXXX(id)                                         │
│  3. addActivity() 记录活动                                       │
│  4. refreshData() 刷新数据                                       │
│  5. setLoading(false)                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API Route (/api/crm)                          │
│  DELETE ?action=deleteCustomer&id=xxx                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Supabase PostgreSQL                              │
│  DELETE FROM customers WHERE id = xxx                           │
│  ON DELETE CASCADE (级联删除 contacts, opportunities)            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 乐观更新策略

当前采用**同步刷新模式**（简化实现）：
1. 用户操作 → 显示 loading 状态
2. API 调用 → 数据库更新
3. 重新 fetch 全部数据 → UI 更新

**后续可优化为乐观更新**：
1. 用户操作 → 立即更新本地 state
2. 后台 API 调用
3. 失败则回滚 + toast 提示

---

## 3. UI/UX 设计

### 3.1 设计原则

| 原则 | 说明 | 实现方式 |
|------|------|----------|
| 一致性 | 统一的视觉语言 | 渐变色系统、阴影系统、间距系统 |
| 反馈 | 操作即时反馈 | Loading 状态、Toast 提示 |
| 效率 | 减少操作步骤 | 快捷操作、批量操作 |
| 可用性 | 清晰的视觉层级 | 卡片系统、徽章系统 |

### 3.2 颜色系统

```css
/* 主色调 - 紫色系 */
--primary: oklch(0.55 0.22 260);

/* 功能色 */
--success: oklch(0.7 0.2 160);   /* 绿色 - 成功/活跃 */
--warning: oklch(0.75 0.18 60); /* 橙色 - 警告/谈判 */
--danger: oklch(0.6 0.25 25);   /* 红色 - 危险/删除 */

/* 模块色 */
--customer-color: from-blue-500 to-cyan-500;
--contact-color: from-green-500 to-emerald-500;
--opportunity-color: from-orange-500 to-amber-500;
```

### 3.3 卡片系统

```css
/* 基础卡片 */
.card {
  background: var(--card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
  transition: all 0.3s ease;
}

/* 悬停效果 */
.card-hover:hover {
  box-shadow: var(--shadow-card);
  transform: translateY(-2px);
}

/* 渐变边框卡片 */
.gradient-border {
  position: relative;
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: var(--gradient-primary);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
```

### 3.4 动画系统

| 动画类型 | 使用场景 | CSS 类 |
|----------|----------|--------|
| 入场动画 | 列表项加载 | `animate-in slide-in-from-bottom-2` |
| 悬停动画 | 卡片/按钮交互 | `hover:scale-105 transition-all` |
| Loading | 数据加载 | `animate-pulse` |
| 渐变背景 | 强调元素 | `bg-gradient-to-r` |

---

## 4. 页面原型

### 4.1 仪表盘 (/)

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌─────┐                                                          │
│  │ ☰   │  简易CRM                                    🔍 搜索       │
│  └─────┘  ─────────────────────────────────────────────────────── │
├──────────┬───────────────────────────────────────────────────────────┤
│ 仪表盘   │                                                           │
│ 客户管理 │  欢迎回来 👋                                              │
│ 销售机会 │  这里是你的业务数据总览                                     │
│ 联系人   │                                                           │
│ ────────│                                                           │
│ 设置     │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│          │  │ 👥        │ │ 👤        │ │ 💼        │ │ 💰        │    │
│          │  │ 客户总数   │ │ 联系人总数 │ │ 销售机会  │ │ 成交总额  │    │
│          │  │   12      │ │   28      │ │   8      │ │  ¥125,000│    │
│          │  │ 较上月+12% │ │ 较上月+5%  │ │ 较上月+3% │ │ 较上月+18%│    │
│          │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│          │                                                           │
│          │  ┌─────────────────────┐  ┌─────────────────────┐        │
│          │  │ 销售漏斗            │  │ 最近活动              │        │
│          │  │━━━━━━━━━━━━━━━━━━━━━│  │ ● 新增客户 北京科技  │        │
│          │  │ 线索      ████░░ 3 │  │   3分钟前            │        │
│          │  │ Qualified ███░░░ 2 │  │ ● 更新机会 ERP项目   │        │
│          │  │ 提案      ██░░░░ 1 │  │   15分钟前           │        │
│          │  │ 谈判      █░░░░░ 1 │  │ ● 成交 智能家居项目  │        │
│          │  │ 成交      ████░░ 4 │  │   1小时前            │        │
│          │  └─────────────────────┘  └─────────────────────┘        │
│          │                                                           │
│          │  ┌─────────────────────────────────────────────────────┐ │
│          │  │ 最近销售机会                         查看全部 →      │ │
│          │  │─────────────────────────────────────────────────────│ │
│          │  │ 💼 ERP系统采购项目   北京科技有限公司   ¥500,000     │ │
│          │  │ 💼 智能家居解决方案   科技创新公司     ¥280,000     │ │
│          │  │ 💼 数据中心建设       企业服务集团     ¥150,000     │ │
│          │  └─────────────────────────────────────────────────────┘ │
└──────────┴───────────────────────────────────────────────────────────┘
```

### 4.2 客户列表 (/customers)

```
┌────────────────────────────────────────────────────────────────────┐
│ 客户管理                                    [+ 新建客户]            │
│ 共 12 个客户                                                        │
├────────────────────────────────────────────────────────────────────┤
│ [🔍 搜索客户名称、公司或邮箱...]  [全部状态 ▼]                     │
├────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ 客户              │ 公司       │ 联系方式       │ 状态   │ 时间 │ │
│ │────────────────────────────────────────────────────────────────│ │
│ │ 👤 北京科技有限公司│ 科贸大厦   │ 📧 contact@.. │ 🟢活跃  │ 3月1 │ │
│ │                   │            │ 📞 010-123..  │         │      │ │
│ │ 👤 科技创新公司   │ 中关村     │ 📧 tech@..    │ 🔵潜在  │ 2月28│ │
│ │                   │            │ 📞 021-456..  │         │      │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│                      [< 1 2 3 >]                                   │
└────────────────────────────────────────────────────────────────────┘
```

### 4.3 客户详情 (/customers/[id])

```
┌────────────────────────────────────────────────────────────────────┐
│ ← 返回  客户详情                                                    │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┐  ┌──────────────────────────────────┐│
│ │ 👤 北京科技有限公司       │  │ 相关联系人                        ││
│ │ 🟢 活跃                  │  │──────────────────────────────────││
│ │                           │  │ 👤 张明 (技术总监) - 主要联系人   ││
│ │ 📧 contact@example.com   │  │    📞 13800138000               ││
│ │ 📞 010-12345678          │  │    📧 zhang@example.com           ││
│ │ 🌐 www.example.com       │  │──────────────────────────────────││
│ │ 📍 北京市朝阳区科贸大厦   │  │ 👤 李华 (销售经理)               ││
│ │ 🏭 互联网                │  │    📞 13900139000               ││
│ └──────────────────────────┘  └──────────────────────────────────┘│
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ 销售机会                            [+ 添加机会]                 │ │
│ │────────────────────────────────────────────────────────────────│ │
│ │ 💼 ERP系统采购项目    ¥500,000    🟢 已成交                    │ │
│ │    预计 2024-06-30 成交           成交概率 100%                 │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ 操作日志                                                      │ │
│ │────────────────────────────────────────────────────────────────│ │
│ │ ● 2024-03-01 10:30 新增客户                                   │ │
│ │ ● 2024-03-02 14:20 添加联系人 张明                             │ │
│ │ ● 2024-03-05 09:15 创建销售机会 ERP系统采购项目                │ │
│ │ ● 2024-03-10 16:00 销售机会进入成交阶段                        │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                                                                    │
│                           [✏️ 编辑]  [🗑️ 删除]                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. 交互流程

### 5.1 删除操作流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        删除操作流程                               │
└─────────────────────────────────────────────────────────────────┘

用户视角:
  1. 在列表页/详情页点击 🗑️ 删除按钮
           │
           ▼
  2. 显示确认对话框
     ┌─────────────────────────────────────────┐
     │  🗑️ 确认删除                             │
     │                                          │
     │  确定要删除「客户名称」吗？               │
     │                                          │
     │  此操作不可撤销，相关联系人和             │
     │  销售机会也会被一并删除。                 │
     │                                          │
     │         [取消]  [确认删除]               │
     └─────────────────────────────────────────┘
           │
           ▼
  3a. 点击「取消」→ 关闭对话框，无操作
           或
  3b. 点击「确认删除」
           │
           ▼
  4. 显示 Loading 状态，按钮禁用
           │
           ▼
  5. API 调用 DELETE /api/crm?action=deleteCustomer&id=xxx
           │
           ▼
  6a. 成功 → Toast 提示"删除成功"
      → 自动返回列表页或刷新列表
      → 添加活动记录
           或
  6b. 失败 → Toast 提示错误信息
      → 对话框保持打开
      → 显示错误详情
```

### 5.2 编辑操作流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        编辑操作流程                               │
└─────────────────────────────────────────────────────────────────┘

用户视角:
  1. 在详情页点击 ✏️ 编辑按钮
           │
           ▼
  2. 跳转到编辑页面 /customers/[id]/edit
           │
           ▼
  3. 显示预填充的表单
     ┌─────────────────────────────────────────┐
     │ 编辑客户                                  │
     │─────────────────────────────────────────│
     │ 客户名称: [北京科技有限公司____________]   │
     │ 公司名称: [科贸大厦____________________]   │
     │ 邮箱:     [contact@example.com_________] │
     │ 电话:     [010-12345678_______________]  │
     │ 状态:     [🟢 活跃 ▼__________________]  │
     │ 行业:     [互联网_____________________] │
     │ 网站:     [www.example.com_____________] │
     │ 地址:     [北京市朝阳区科贸大厦_________] │
     │ 备注:     [___________________________] │
     │           [___________________________] │
     │                                          │
     │         [取消]  [保存修改]               │
     └─────────────────────────────────────────┘
           │
           ▼
  4a. 点击「取消」→ 返回详情页，不保存
           或
  4b. 修改表单内容 → 点击「保存修改」
           │
           ▼
  5. 表单验证
     ├── 必填字段检查
     ├── 邮箱格式检查
     └── 电话格式检查
           │
           ▼
  6. 显示 Loading 状态
           │
           ▼
  7. API 调用 PUT /api/crm
     { action: "updateCustomer", id: xxx, data: {...} }
           │
           ▼
  8a. 成功 → Toast "保存成功"
      → 自动返回详情页
      → 显示更新后的数据
      → 添加活动记录
           或
  8b. 失败 → Toast 错误提示
      → 保持编辑状态
      → 高亮错误字段
```

### 5.3 新建操作流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        新建操作流程                               │
└─────────────────────────────────────────────────────────────────┘

用户视角:
  1. 在列表页点击 [+ 新建客户] 按钮
           │
           ▼
  2. 跳转到新建页面 /customers/new
           │
           ▼
  3. 显示空表单
     ┌─────────────────────────────────────────┐
     │ 新建客户                                  │
     │─────────────────────────────────────────│
     │ *客户名称: [___________________________] │
     │ *公司名称: [___________________________] │
     │ 邮箱:     [___________________________] │
     │ 电话:     [___________________________] │
     │ 状态:     [🔵 潜在客户 ▼_____________] │
     │ 行业:     [___________________________] │
     │ 网站:     [___________________________] │
     │ 地址:     [___________________________] │
     │ 备注:     [___________________________] │
     │           [___________________________] │
     │                                          │
     │         [取消]  [创建客户]               │
     └─────────────────────────────────────────┘
           │
           ▼
  4a. 点击「取消」→ 返回列表页
           或
  4b. 填写表单 → 点击「创建客户」
           │
           ▼
  5. 表单验证（同编辑）
           │
           ▼
  6. Loading 状态
           │
           ▼
  7. API 调用 POST /api/crm
     { action: "createCustomer", data: {...} }
           │
           ▼
  8a. 成功 → Toast "客户创建成功"
      → 跳转到新客户详情页
      → 添加活动记录
           或
  8b. 失败 → Toast 错误提示
      → 保持表单状态
```

---

## 6. V2.1 删除/编辑功能详细方案

### 6.1 删除功能详细设计

#### 6.1.1 列表页删除

**入口**: 表格行右侧操作列（悬停显示）

```
桌面端:
┌────────────────────────────────────────────────────┐
│ 客户名称 │ 公司 │ 邮箱 │ 电话 │ 状态 │ 操作 │ ← 悬停显示删除按钮
└────────────────────────────────────────────────────┘

移动端:
┌────────────────────────────────────────────────────┐
│ 客户卡片                                            │
│ 名称: xxx     公司: xxx        [🗑️] ← 始终显示   │
└────────────────────────────────────────────────────┘
```

**交互细节**:
1. 桌面端删除按钮默认 `opacity-0`，悬停行时 `opacity-100`
2. 点击后弹出确认对话框
3. 对话框显示关联数据警告（联系人数量、销售机会数量）
4. 确认后执行删除

#### 6.1.2 确认对话框设计

```typescript
// 对话框组件 Props
interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  entityName: string;
  relatedCounts?: {
    contacts: number;
    opportunities: number;
  };
  onConfirm: () => Promise<void>;
}

// 降级警告文案
const getWarningMessage = (relatedCounts?: RelatedCounts) => {
  if (!relatedCounts) return '';
  
  const parts = [];
  if (relatedCounts.contacts > 0) {
    parts.push(`${relatedCounts.contacts} 个联系人`);
  }
  if (relatedCounts.opportunities > 0) {
    parts.push(`${relatedCounts.opportunities} 个销售机会`);
  }
  
  if (parts.length === 0) return '此操作不可撤销。';
  return `将同时删除 ${parts.join('和')}。此操作不可撤销。`;
};
```

#### 6.1.3 删除状态处理

```typescript
// useDelete hook
function useDelete<T>(deleteFn: (id: string) => Promise<void>) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setError(null);
      await deleteFn(id);
      toast.success('删除成功');
    } catch (err) {
      setError(err.message);
      toast.error(`删除失败: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };
  
  return { deletingId, error, handleDelete };
}
```

#### 6.1.4 级联删除规则

| 被删除项 | 关联数据处理 |
|----------|-------------|
| 客户 | 联系人（ON DELETE CASCADE）、销售机会（ON DELETE CASCADE） |
| 联系人 | 关联的销售机会 contact_id 设为 NULL |
| 销售机会 | 独立存在，不影响其他数据 |

### 6.2 编辑功能详细设计

#### 6.2.1 表单设计

```typescript
// 表单字段配置
const customerFields: FormField[] = [
  { name: 'name', label: '客户名称', type: 'text', required: true, placeholder: '输入客户名称' },
  { name: 'company', label: '公司名称', type: 'text', required: true, placeholder: '输入公司名称' },
  { name: 'email', label: '邮箱', type: 'email', placeholder: '输入邮箱地址' },
  { name: 'phone', label: '电话', type: 'tel', placeholder: '输入电话号码' },
  { name: 'status', label: '状态', type: 'select', options: statusOptions },
  { name: 'industry', label: '行业', type: 'text', placeholder: '输入所属行业' },
  { name: 'website', label: '网站', type: 'url', placeholder: 'https://' },
  { name: 'address', label: '地址', type: 'textarea', placeholder: '输入详细地址' },
  { name: 'notes', label: '备注', type: 'textarea', placeholder: '输入备注信息' },
];
```

#### 6.2.2 表单验证规则

```typescript
// Zod Schema
const customerSchema = z.object({
  name: z.string().min(1, '请输入客户名称').max(128, '名称不能超过128字符'),
  company: z.string().min(1, '请输入公司名称').max(255, '公司名称不能超过255字符'),
  email: z.string().email('请输入有效的邮箱地址').or(z.literal('')).optional(),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, '请输入有效的电话号码').optional(),
  status: z.enum(['active', 'inactive', 'prospect']),
  industry: z.string().max(100).optional(),
  website: z.string().url('请输入有效的网址').or(z.literal('')).optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
```

#### 6.2.3 编辑页面组件

```typescript
// /customers/[id]/edit/page.tsx
export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { customers, updateCustomer, loading } = useCRM();
  
  const customer = customers.find(c => c.id === params.id);
  
  // 加载状态
  if (loading && !customer) {
    return <PageSkeleton />;
  }
  
  // 未找到
  if (!customer) {
    return <NotFound />;
  }
  
  const handleSubmit = async (data: CustomerFormData) => {
    await updateCustomer(params.id, data);
    router.push(`/customers/${params.id}`);
  };
  
  return (
    <CustomerForm 
      initialData={customer}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      mode="edit"
    />
  );
}
```

#### 6.2.4 通用表单组件

```typescript
interface CustomerFormProps {
  initialData?: Partial<Customer>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  loading?: boolean;
}

// 表单组件包含:
- 标题区（新建/编辑）
- 表单字段（使用 React Hook Form + Zod）
- 底部操作区（取消/提交按钮）
- Loading 状态处理
- 错误提示
```

### 6.3 活动记录追踪

#### 6.3.1 活动类型定义

```typescript
type ActivityType = 
  | 'created'      // 新建
  | 'updated'       // 更新
  | 'deleted'       // 删除
  | 'stage_change'; // 阶段变更

interface Activity {
  id: string;
  type: ActivityType;
  entityType: 'customer' | 'contact' | 'opportunity';
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
}
```

#### 6.3.2 自动记录活动

```typescript
// 在每个 CRUD 操作中自动添加活动记录
async function deleteCustomer(id: string) {
  const customer = await getCustomerById(id);
  
  // 执行删除
  await supabase.from('customers').delete().eq('id', id);
  
  // 记录活动
  await supabase.from('activities').insert({
    type: 'deleted',
    entity_type: 'customer',
    entity_id: id,
    entity_name: customer.name,
    description: `删除客户 ${customer.name}`,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 7. 部署方案

### 7.1 部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Coze 平台 (PaaS)                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   托管的 Next.js 应用                        ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        ││
│  │  │  Dev 环境   │  │  Prod 环境  │  │   预览环境   │        ││
│  │  │  Port 5000  │  │  Port 5000  │  │   Port 5000 │        ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘        ││
│  └────────────────────────────┬────────────────────────────────┘│
└──────────────────────────────┼──────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│       Supabase Cloud          │  │        CDN (自动)            │
│  ┌──────────────────────────┐ │  │                              │
│  │  PostgreSQL 数据库        │ │  │   静态资源缓存               │
│  │  - 托管式备份             │ │  │   全球加速                   │
│  │  - 自动扩缩容             │ │  │                              │
│  └──────────────────────────┘ │  │                              │
│  ┌──────────────────────────┐ │  │                              │
│  │  RLS 策略配置            │ │  │                              │
│  │  - 表级安全策略           │ │  │                              │
│  └──────────────────────────┘ │  │                              │
│  ┌──────────────────────────┐ │  │                              │
│  │  API 网关                │ │  │                              │
│  │  - HTTPS 自动证书        │ │  │                              │
│  │  - CORS 配置             │ │  │                              │
│  └──────────────────────────┘ │  │                              │
└──────────────────────────────┘  └──────────────────────────────┘
```

### 7.2 环境配置

| 环境 | 变量 | 来源 |
|------|------|------|
| Dev/Prod | `COZE_SUPABASE_URL` | Supabase 项目设置 |
| Dev/Prod | `COZE_SUPABASE_ANON_KEY` | Supabase 项目设置 |
| Dev/Prod | `COZE_SUPABASE_SERVICE_ROLE_KEY` | Supabase 项目设置（可选） |

### 7.3 发布流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        发布流程                                   │
└─────────────────────────────────────────────────────────────────┘

1. 本地开发
   │
   ├── pnpm dev → localhost:5000
   └── 代码修改 → 自动热更新
           │
           ▼
2. 代码提交
   │
   ├── git add .
   ├── git commit -m "feat: ..."
   └── git push
           │
           ▼
3. 构建验证
   │
   ├── Coze 平台自动构建
   ├── pnpm build
   └── TypeScript 检查
           │
           ▼
4. 环境变量注入
   │
   ├── 从 Coze 平台读取
   └── 注入到运行时环境
           │
           ▼
5. 生产部署
   │
   └── bash scripts/start.sh
           │
           ▼
6. 访问验证
   │
   └── https://{project}.dev.coze.site
```

### 7.4 监控与日志

| 类型 | 位置 | 说明 |
|------|------|------|
| 应用日志 | `/app/work/logs/bypass/app.log` | 服务端日志 |
| 开发日志 | `/app/work/logs/bypass/dev.log` | HMR/热更新 |
| 浏览器日志 | Console | 前端调试 |
| API 日志 | app.log | 请求追踪 |

### 7.5 备份策略

| 数据类型 | 备份频率 | 保留时间 |
|----------|----------|-----------|
| 数据库 | 自动每日 | 7天 |
| 代码 | Git | 永久 |
| 静态资源 | CDN 缓存 | 自动 |

---

## 更新日志

| 版本 | 日期 | 内容 |
|------|------|------|
| V1.0 | 2024-03 | 初始版本，基础 CRUD 功能 |
| V2.0 | 2024-04 | UI/UX PRO MAX 界面优化 |
| V2.1 | 2024-04 | 删除/编辑功能详细方案 |
