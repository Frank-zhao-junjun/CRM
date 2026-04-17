# CRM V5.1 数据导入功能需求

## 项目背景
CRM系统已完成V5.0版本，拥有完善的数据导出功能。为提升数据录入效率，新增配套的数据导入功能。

## 功能规格

### 1. 导入对话框组件 (ImportDialog)
- 位置：在现有导出对话框附近（如 customers/page.tsx）
- 交互：点击按钮打开 Sheet/Modal 对话框
- 状态：idle / uploading / processing / success / error

### 2. 支持导入的模块
- 客户 (customers)
- 联系人 (contacts)
- 产品 (products)
- 销售线索 (leads)

### 3. 导入流程
1. **文件选择**：支持 CSV/XLSX 格式
2. **字段映射**：自动识别列名，映射到数据库字段
3. **数据预览**：显示前10行预览，标记必填字段
4. **验证处理**：
   - 必填字段检查
   - 格式验证（日期、手机号等）
   - 重复检测
5. **导入执行**：批量插入，显示进度
6. **结果报告**：成功/失败数量，失败行详情下载

### 4. 技术实现
- 使用 xlsx 库解析 Excel/CSV
- 复用现有导出API的数据模型
- 支持批量写入（每批100条）
- 错误行标记并支持重新导入

### 5. UI组件
- ImportDialog 组件
- 导入进度条
- 字段映射表格
- 错误报告展示

## 文件结构
```
src/components/crm/
  └── import-dialog.tsx    # 导入对话框组件

src/lib/
  └── import-utils.ts      # 导入工具函数

src/app/api/crm/
  └── import/
      └── route.ts         # 导入API
```

## 验收标准
1. 可成功导入CSV/XLSX格式的客户数据
2. 支持字段映射和预览
3. 错误处理完善，失败行可导出
4. 与现有导出功能风格一致
