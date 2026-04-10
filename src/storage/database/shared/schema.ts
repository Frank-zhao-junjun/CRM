import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, varchar, integer, numeric, boolean, index } from "drizzle-orm/pg-core";

// 客户表
export const customers = pgTable(
  "customers",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    company: varchar("company", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("prospect"), // active, inactive, prospect
    industry: varchar("industry", { length: 100 }),
    website: varchar("website", { length: 500 }),
    address: text("address"),
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("customers_status_idx").on(table.status),
    index("customers_company_idx").on(table.company),
    index("customers_created_at_idx").on(table.created_at),
  ]
);

// 联系人表
export const contacts = pgTable(
  "contacts",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    first_name: varchar("first_name", { length: 64 }).notNull(),
    last_name: varchar("last_name", { length: 64 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    position: varchar("position", { length: 128 }),
    customer_id: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
    is_primary: boolean("is_primary").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("contacts_customer_id_idx").on(table.customer_id),
    index("contacts_email_idx").on(table.email),
  ]
);

// 销售线索表
export const leads = pgTable(
  "leads",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(), // referral, website, cold_call, event, advertisement, other
    customer_id: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
    customer_name: varchar("customer_name", { length: 255 }).notNull(),
    contact_id: varchar("contact_id", { length: 36 }).references(() => contacts.id, { onDelete: "set null" }),
    contact_name: varchar("contact_name", { length: 255 }),
    estimated_value: numeric("estimated_value", { precision: 15, scale: 2 }).notNull().default("0"),
    probability: integer("probability").notNull().default(10), // 线索默认10%
    status: varchar("status", { length: 20 }).notNull().default("new"), // new, contacted, qualified, disqualified
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("leads_customer_id_idx").on(table.customer_id),
    index("leads_status_idx").on(table.status),
    index("leads_source_idx").on(table.source),
    index("leads_created_at_idx").on(table.created_at),
  ]
);

// 销售机会表
export const opportunities = pgTable(
  "opportunities",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    customer_id: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
    contact_id: varchar("contact_id", { length: 36 }).references(() => contacts.id, { onDelete: "set null" }),
    customer_name: varchar("customer_name", { length: 255 }).notNull(),
    contact_name: varchar("contact_name", { length: 255 }),
    value: numeric("value", { precision: 15, scale: 2 }).notNull().default("0"),
    stage: varchar("stage", { length: 20 }).notNull().default("qualified"), // qualified, proposal, negotiation, closed_won, closed_lost (线索已移除)
    probability: integer("probability").notNull().default(30), // 机会默认30%
    expected_close_date: timestamp("expected_close_date", { withTimezone: true }),
    description: text("description"),
    notes: text("notes"),
    source_lead_id: varchar("source_lead_id", { length: 36 }).references(() => leads.id, { onDelete: "set null" }), // 来源线索
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("opportunities_customer_id_idx").on(table.customer_id),
    index("opportunities_stage_idx").on(table.stage),
    index("opportunities_source_lead_id_idx").on(table.source_lead_id),
    index("opportunities_expected_close_date_idx").on(table.expected_close_date),
    index("opportunities_created_at_idx").on(table.created_at),
  ]
);

// 活动记录表
export const activities = pgTable(
  "activities",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    type: varchar("type", { length: 50 }).notNull(), // created, updated, deleted, stage_change, closed_won, closed_lost
    entity_type: varchar("entity_type", { length: 50 }).notNull(), // customer, contact, opportunity
    entity_id: varchar("entity_id", { length: 36 }).notNull(),
    entity_name: varchar("entity_name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("activities_entity_type_idx").on(table.entity_type),
    index("activities_timestamp_idx").on(table.timestamp),
  ]
);

// 跟进记录表
export const followUps = pgTable(
  "follow_ups",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    entity_type: varchar("entity_type", { length: 20 }).notNull(), // customer, lead, opportunity
    entity_id: varchar("entity_id", { length: 36 }).notNull(),
    entity_name: varchar("entity_name", { length: 255 }).notNull(),
    type: varchar("type", { length: 30 }).notNull().default("note"), // call, email, meeting, note
    method: varchar("method", { length: 30 }).default("note"), // phone, wechat, email, meeting, other
    content: text("content").notNull(),
    scheduled_at: timestamp("scheduled_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    next_follow_up_at: timestamp("next_follow_up_at", { withTimezone: true }),
    created_by: varchar("created_by", { length: 100 }).default("sales_a"),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("follow_ups_entity_idx").on(table.entity_type, table.entity_id),
    index("follow_ups_scheduled_idx").on(table.scheduled_at),
  ]
);

// 通知表
export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    type: varchar("type", { length: 30 }).notNull(), // overdue, reminder, stage_change, info
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    entity_type: varchar("entity_type", { length: 20 }),
    entity_id: varchar("entity_id", { length: 36 }),
    is_read: boolean("is_read").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_read_idx").on(table.is_read),
  ]
);

// 报价单表
export const quotes = pgTable(
  "quotes",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    opportunity_id: varchar("opportunity_id", { length: 36 }).notNull().references(() => opportunities.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    version: integer("version").notNull().default(1), // 报价单版本号
    revision_reason: text("revision_reason"), // 新建版本的原因
    status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, active, accepted, rejected, expired
    valid_from: timestamp("valid_from"),
    valid_until: timestamp("valid_until"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 15, scale: 2 }).notNull().default("0"),
    tax: numeric("tax", { precision: 15, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 15, scale: 2 }).notNull().default("0"),
    terms: text("terms"),
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("quotes_opportunity_id_idx").on(table.opportunity_id),
    index("quotes_status_idx").on(table.status),
  ]
);

// 报价单明细表
export const quoteItems = pgTable(
  "quote_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    quote_id: varchar("quote_id", { length: 36 }).notNull().references(() => quotes.id, { onDelete: "cascade" }),
    product_name: varchar("product_name", { length: 255 }).notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull().default(1),
    unit_price: numeric("unit_price", { precision: 15, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 15, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
    sort_order: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("quote_items_quote_id_idx").on(table.quote_id),
  ]
);

// 成交订单表
export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    quote_id: varchar("quote_id", { length: 36 }).references(() => quotes.id, { onDelete: "set null" }),
    opportunity_id: varchar("opportunity_id", { length: 36 }).notNull().references(() => opportunities.id, { onDelete: "cascade" }),
    customer_id: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
    order_number: varchar("order_number", { length: 50 }).notNull().unique(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, confirmed, fulfilled, cancelled
    order_date: timestamp("order_date"),
    delivery_date: timestamp("delivery_date"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
    tax: numeric("tax", { precision: 15, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 15, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_opportunity_id_idx").on(table.opportunity_id),
    index("orders_customer_id_idx").on(table.customer_id),
    index("orders_status_idx").on(table.status),
  ]
);

// 订单明细表
export const orderItems = pgTable(
  "order_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_id: varchar("order_id", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
    product_name: varchar("product_name", { length: 255 }).notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull().default(1),
    unit_price: numeric("unit_price", { precision: 15, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
    sort_order: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.order_id),
  ]
);

// 类型导出
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = typeof followUps.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
