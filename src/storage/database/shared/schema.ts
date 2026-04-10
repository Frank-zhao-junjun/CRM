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

// 销售机会表
export const opportunities = pgTable(
  "opportunities",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    customer_id: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id, { onDelete: "cascade" }),
    contact_id: varchar("contact_id", { length: 36 }).references(() => contacts.id, { onDelete: "set null" }),
    value: numeric("value", { precision: 15, scale: 2 }).notNull().default("0"),
    stage: varchar("stage", { length: 20 }).notNull().default("lead"), // lead, qualified, proposal, negotiation, closed_won, closed_lost
    probability: integer("probability").notNull().default(10),
    expected_close_date: timestamp("expected_close_date", { withTimezone: true }),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("opportunities_customer_id_idx").on(table.customer_id),
    index("opportunities_stage_idx").on(table.stage),
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

// 类型导出
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
