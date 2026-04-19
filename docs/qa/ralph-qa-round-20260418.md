# Ralph QA Round 2026-04-18

## 目标

基于 Ralph 方法，将当前仓库里已经实现的 CRM 功能重新归并为更贴近业务交付的用户故事，并执行一轮风险驱动 QA。

本轮 QA 采用以下策略：

- Ralph 风格故事分组：先按用户价值链而不是按页面零散功能拆分。
- Risk-Based QA：优先检查资金、合同、邮件、权限、主销售管道等高风险链路。
- Evidence-First 质量门：先跑 typecheck、lint、test、build，再决定是否继续做运行态验证。

## 范围依据

- 现有 Ralph 工件：`prd.json`、`progress.txt`
- 产品声明：`README.md`
- 实际路由面：`src/app/*`

## Ralph 风格 US 归并

| US | 业务目标 | 主要范围 | 风险等级 | 本轮状态 |
| --- | --- | --- | --- | --- |
| US-R1 | 作为销售人员，我要快速看到全局业务态势并检索关键对象 | `/`, `/activities`, 全局搜索、仪表盘 | High | 未完成运行态验证 |
| US-R2 | 作为客户经理，我要维护客户/联系人并查看客户 360 视图 | `/customers`, `/contacts` | High | 未完成运行态验证 |
| US-R3 | 作为销售人员，我要管理线索和商机，并使用 AI 判断优先级 | `/leads`, `/opportunities`, `/predictions` | Critical | 阻断 |
| US-R4 | 作为商务/财务协同角色，我要完成报价到回款的完整单据链路 | `/quotes`, `/orders`, `/contracts`, `/invoices`, `/payments` | Critical | 阻断 |
| US-R5 | 作为执行人员，我要通过任务、日历和跟进动作推动成交 | `/tasks`, `/calendar`, `/follow-ups` | High | 阻断 |
| US-R6 | 作为销售运营，我要发送邮件并运行自动化序列/工作流 | `/emails`, `/automation`, `/sequences`, `/workflows`, `/settings/email`, `/settings/templates` | High | 阻断 |
| US-R7 | 作为管理者，我要查看预测、报表、流失预警和导入导出结果 | `/reports`, `/forecasts`, `/churn`, `/churn-alerts`, `/data` | High | 高风险待复测 |
| US-R8 | 作为管理员，我要管理角色、权限和系统设置 | `/settings`, `/settings/roles`, `/settings/users` | Critical | 阻断 |

## 质量门结果

### 1. Type Check

执行命令：`pnpm ts-check`

结果：失败。

已确认的阻断点：

- `src/app/emails/page.tsx:256` JSX 解析失败
- `src/app/opportunities/page.tsx:306` JSX 文本中的 `<40%` 触发解析失败

### 2. Lint

执行命令：`pnpm eslint .`

结果：失败。

汇总：`312 problems (71 errors, 241 warnings)`

错误分布已覆盖以下高风险区域：

- 自动化与工作流
- 日历
- 流失分析
- 数据导入导出
- 发票
- 线索评分与商机预测引擎
- 多个 API 路由

### 3. Test

执行命令：`pnpm test`

结果：失败。

原因：仓库未定义 `test` script，当前不存在可执行的自动化回归门。

### 4. Build

执行命令：`pnpm next build`

结果：失败。

已确认的阻断点：

- `src/app/emails/page.tsx:256` JSX 解析失败
- `src/app/invoices/[id]/edit/page.tsx:20` `import type` 语法使用错误
- `src/app/opportunities/page.tsx:306` JSX 文本中的 `<40%` 解析失败
- `src/app/calendar/page.tsx:12` 依赖了不存在的 `@/hooks/use-toast`
- `src/storage/database/supabase-client.ts:2` 在会进入前端打包链路的模块里引入 `child_process`
- `src/app/contracts/[id]/edit/page.tsx:23` 和 `src/app/contracts/new/page.tsx` 引用了不存在的 `FileBarGraph` 图标导出

## 主要发现

### P0 阻断

1. 邮件历史页无法通过编译

- 证据：`src/app/emails/page.tsx:256`
- 影响 US：US-R6
- 影响说明：邮件发送历史页和整体验证构建被直接阻断。

2. 商机列表页包含会破坏 JSX 解析的文本

- 证据：`src/app/opportunities/page.tsx:306`
- 影响 US：US-R3
- 影响说明：核心商机列表页面无法稳定进入生产构建。

3. 发票编辑页导入语法错误

- 证据：`src/app/invoices/[id]/edit/page.tsx:20`
- 影响 US：US-R4
- 影响说明：资金链路中的发票编辑能力无法通过构建。

4. 日历页面依赖不存在的 hook

- 证据：`src/app/calendar/page.tsx:12`
- 补充证据：`src/hooks` 目录当前仅存在 `use-mobile.ts` 和 `useReportData.ts`
- 影响 US：US-R5
- 影响说明：协同执行链路存在确定性的模块缺失。

5. 权限/设置链路存在服务端模块泄漏到前端打包问题

- 证据：`src/storage/database/supabase-client.ts:2`
- 影响 US：US-R8
- 影响说明：`child_process` 被卷入前端构建依赖图，会导致设置/权限相关页面不可构建或不可发布。

6. 合同链路引用了不存在的 Lucide 图标导出

- 证据：`src/app/contracts/[id]/edit/page.tsx:23`
- 影响 US：US-R4
- 影响说明：合同新建/编辑链路存在确定性构建失败。

### P1 高风险

7. 自动化回归门缺失

- 证据：`pnpm test` 返回 `Missing script: test`
- 影响 US：全部，尤其是 US-R3、US-R4、US-R6、US-R8
- 影响说明：目前没有最低限度的自动化回归保护，任何修复都缺乏持续验证。

8. Lint 错误和警告规模过大，说明高风险区域存在成片技术债

- 证据：`pnpm eslint .` 汇总为 `71 errors, 241 warnings`
- 典型问题：`no-explicit-any`、未使用变量、React Hook 依赖问题、访问声明前函数、未转义 JSX 文本
- 影响说明：即使局部修掉当前 build blocker，仍然很可能在运行态暴露状态同步、边界处理和类型安全问题。

### P2 中风险

9. README 中声明的功能范围明显大于当前可通过的质量门状态

- 证据：`README.md` 列出了完整 CRM 功能面，但当前 typecheck/build 无法通过
- 影响说明：对外可交付预期与实际可发布状态存在偏差。

## QA 结论

本轮 Ralph QA 结论：**未通过质量门，不建议发布，不建议继续基于当前主干做功能验收。**

判定依据：

- Type Check 失败
- Lint 失败且错误面较广
- 自动化测试脚本缺失
- Production Build 失败

## 未完成项与限制

- 未执行浏览器端完整冒烟，因为构建阶段已经出现阻断级失败。
- 未执行自动化 E2E，因为仓库当前无测试脚本，也没有现成浏览器自动化基座。
- 高风险功能 QA 本轮主要通过静态门禁和关键代码路径审查完成，而不是通过运行态回归完成。

## 建议修复顺序

1. 先修复所有 build blocker：`emails`、`opportunities`、`invoices/[id]/edit`、`calendar`、`contracts`、`supabase-client`。
2. 为 US-R3、US-R4、US-R6、US-R8 至少补一层最小 smoke test 或集成测试入口。
3. 重新执行 `pnpm ts-check`、`pnpm eslint .`、`pnpm next build`。
4. 在质量门恢复为绿色后，再做一次按 US-R3 到 US-R8 的高风险运行态验收。
