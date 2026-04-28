#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli/index.ts
var import_config = require("dotenv/config");
var import_commander12 = require("commander");

// src/cli/utils/formatter.ts
var import_chalk = __toESM(require("chalk"));
var import_cli_table3 = __toESM(require("cli-table3"));
var globalOptions = {};
function setGlobalOptions(opts) {
  globalOptions = opts;
}
function getGlobalOptions() {
  return globalOptions;
}
function c(text, color = "white") {
  if (globalOptions.noColor || globalOptions.json) return text;
  const map = {
    red: import_chalk.default.red,
    green: import_chalk.default.green,
    yellow: import_chalk.default.yellow,
    blue: import_chalk.default.blue,
    cyan: import_chalk.default.cyan,
    gray: import_chalk.default.gray,
    white: import_chalk.default.white,
    bold: import_chalk.default.bold
  };
  return (map[color] || import_chalk.default.white)(text);
}
function printTable(headers, rows, options) {
  const opts = options || globalOptions;
  if (opts.quiet) return;
  if (opts.json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  if (rows.length === 0) {
    console.log(c("No records found.", "gray"));
    return;
  }
  const head = headers.map((h) => c(h.label, "bold"));
  const table = new import_cli_table3.default({
    head,
    style: opts.noColor ? void 0 : { head: [], border: [] },
    wordWrap: true,
    wrapOnWordBoundary: true
  });
  for (const row of rows) {
    const cells = headers.map((h) => {
      const val = row[h.key];
      if (val === null || val === void 0) return c("\u2014", "gray");
      if (typeof val === "boolean") return val ? c("Yes", "green") : c("No", "red");
      return String(val);
    });
    table.push(cells);
  }
  console.log(table.toString());
}
function printSuccess(message) {
  if (globalOptions.quiet) return;
  console.log(c(`\u2713 ${message}`, "green"));
}
function printError(message) {
  if (globalOptions.quiet) return;
  console.error(c(`\u2717 ${message}`, "red"));
}
function printObject(obj, title) {
  if (globalOptions.quiet) return;
  if (globalOptions.json) {
    console.log(JSON.stringify(obj, null, 2));
    return;
  }
  if (title) {
    console.log(c(`
${title}`, "bold"));
    console.log(c("\u2500".repeat(title.length + 2), "gray"));
  }
  const maxKeyLen = Math.max(...Object.keys(obj).map((k) => k.length));
  for (const [key, val] of Object.entries(obj)) {
    const paddedKey = key.padEnd(maxKeyLen);
    let displayVal;
    if (val === null || val === void 0) displayVal = c("\u2014", "gray");
    else if (typeof val === "boolean") displayVal = val ? c("Yes", "green") : c("No", "red");
    else displayVal = String(val);
    console.log(`  ${c(paddedKey, "bold")}: ${displayVal}`);
  }
}
function formatDate(date) {
  if (!date) return "\u2014";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "\u2014";
  return d.toISOString().slice(0, 10);
}
function formatMoney(amount, currency = "CNY") {
  if (amount === null || amount === void 0) return "\u2014";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "\u2014";
  const symbol = currency === "CNY" ? "\xA5" : currency === "USD" ? "$" : currency;
  return `${symbol}${num.toLocaleString("zh-CN")}`;
}

// src/cli/commands/customer.ts
var import_commander = require("commander");

// src/lib/crm-database.ts
var import_node_crypto = require("crypto");

// src/storage/database/supabase-client.server.ts
var import_supabase_js = require("@supabase/supabase-js");
var import_child_process = require("child_process");
var envLoaded = false;
function loadEnv() {
  if (envLoaded || process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
    return;
  }
  try {
    import("dotenv").then((dotenv) => {
      dotenv.config();
    }).catch(() => {
    });
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;
    const output = (0, import_child_process.execSync)(`python3 -c '${pythonCode.replace(/'/g, `'"'"'`)}'`, {
      encoding: "utf-8",
      timeout: 1e4,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const lines = output.trim().split("\n");
    for (const line of lines) {
      if (line.startsWith("#")) continue;
      const eqIndex = line.indexOf("=");
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if (value.startsWith("'") && value.endsWith("'") || value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
    envLoaded = true;
  } catch {
  }
}
function getSupabaseCredentials() {
  loadEnv();
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!url) {
    throw new Error("COZE_SUPABASE_URL is not set");
  }
  if (!anonKey) {
    throw new Error("COZE_SUPABASE_ANON_KEY is not set");
  }
  return { url, anonKey };
}
function getSupabaseServiceRoleKey() {
  loadEnv();
  return process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
}
function getSupabaseClient(token) {
  const { url, anonKey } = getSupabaseCredentials();
  let key;
  if (token) {
    key = anonKey;
  } else {
    const serviceRoleKey = getSupabaseServiceRoleKey();
    key = serviceRoleKey ?? anonKey;
  }
  if (token) {
    return (0, import_supabase_js.createClient)(url, key, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      },
      db: {
        timeout: 6e4
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return (0, import_supabase_js.createClient)(url, key, {
    db: {
      timeout: 6e4
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// src/lib/crm-database.ts
async function getAllCustomers() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("customers").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`\u83B7\u53D6\u5BA2\u6237\u5217\u8868\u5931\u8D25: ${error.message}`);
  return data;
}
async function getCustomerById(id) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("customers").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`\u83B7\u53D6\u5BA2\u6237\u5931\u8D25: ${error.message}`);
  return data;
}
async function createCustomer(customer) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("customers").insert(customer).select().single();
  if (error) throw new Error(`\u521B\u5EFA\u5BA2\u6237\u5931\u8D25: ${error.message}`);
  return data;
}
async function updateCustomer(id, updates) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("customers").update({ ...updates, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(`\u66F4\u65B0\u5BA2\u6237\u5931\u8D25: ${error.message}`);
  return data;
}
async function deleteCustomer(id) {
  const client = getSupabaseClient();
  const { error } = await client.from("customers").delete().eq("id", id);
  if (error) throw new Error(`\u5220\u9664\u5BA2\u6237\u5931\u8D25: ${error.message}`);
}
async function getAllContacts() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("contacts").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`\u83B7\u53D6\u8054\u7CFB\u4EBA\u5217\u8868\u5931\u8D25: ${error.message}`);
  return data;
}
async function getContactsByCustomerId(customerId) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("contacts").select("*").eq("customer_id", customerId).order("is_primary", { ascending: false });
  if (error) throw new Error(`\u83B7\u53D6\u5BA2\u6237\u8054\u7CFB\u4EBA\u5931\u8D25: ${error.message}`);
  return data;
}
async function getContactById(id) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("contacts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`\u83B7\u53D6\u8054\u7CFB\u4EBA\u5931\u8D25: ${error.message}`);
  return data;
}
async function createContact(contact) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("contacts").insert(contact).select().single();
  if (error) throw new Error(`\u521B\u5EFA\u8054\u7CFB\u4EBA\u5931\u8D25: ${error.message}`);
  return data;
}
async function updateContact(id, updates) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("contacts").update({ ...updates, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(`\u66F4\u65B0\u8054\u7CFB\u4EBA\u5931\u8D25: ${error.message}`);
  return data;
}
async function deleteContact(id) {
  const client = getSupabaseClient();
  const { error } = await client.from("contacts").delete().eq("id", id);
  if (error) throw new Error(`\u5220\u9664\u8054\u7CFB\u4EBA\u5931\u8D25: ${error.message}`);
}
async function getAllLeads() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`\u83B7\u53D6\u9500\u552E\u7EBF\u7D22\u5217\u8868\u5931\u8D25: ${error.message}`);
  return data;
}
async function getLeadById(id) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`\u83B7\u53D6\u9500\u552E\u7EBF\u7D22\u5931\u8D25: ${error.message}`);
  return data;
}
async function createLead(lead) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("leads").insert({
    id: lead.id,
    title: lead.title,
    source: lead.source,
    customer_id: lead.customer_id,
    customer_name: lead.customer_name,
    contact_id: lead.contact_id || null,
    contact_name: lead.contact_name || null,
    estimated_value: lead.estimated_value,
    probability: lead.probability ?? 10,
    status: lead.status ?? "new",
    notes: lead.notes || null
  }).select().single();
  if (error) throw new Error(`\u521B\u5EFA\u9500\u552E\u7EBF\u7D22\u5931\u8D25: ${error.message}`);
  return data;
}
async function updateLead(id, updates) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("leads").update({
    ...updates,
    updated_at: (/* @__PURE__ */ new Date()).toISOString(),
    contact_id: updates.contact_id || null,
    contact_name: updates.contact_name || null
  }).eq("id", id).select().single();
  if (error) throw new Error(`\u66F4\u65B0\u9500\u552E\u7EBF\u7D22\u5931\u8D25: ${error.message}`);
  return data;
}
async function deleteLead(id) {
  const client = getSupabaseClient();
  const { error } = await client.from("leads").delete().eq("id", id);
  if (error) throw new Error(`\u5220\u9664\u9500\u552E\u7EBF\u7D22\u5931\u8D25: ${error.message}`);
}
function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    description: row.description || void 0,
    unitPrice: Number(row.unit_price),
    unit: row.unit,
    cost: Number(row.cost),
    stock: row.stock ?? 0,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function getAllProducts() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`\u83B7\u53D6\u4EA7\u54C1\u5217\u8868\u5931\u8D25: ${error.message}`);
  return (data || []).map(rowToProduct);
}
async function getProductById(id) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`\u83B7\u53D6\u4EA7\u54C1\u5931\u8D25: ${error.message}`);
  return data ? rowToProduct(data) : null;
}
async function createProduct(product) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const client = getSupabaseClient();
  const { data, error } = await client.from("products").insert({
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    description: product.description || null,
    unit_price: product.unitPrice,
    unit: product.unit,
    cost: product.cost,
    stock: product.stock ?? 0,
    is_active: product.isActive,
    created_at: product.createdAt || now,
    updated_at: product.updatedAt || now
  }).select().single();
  if (error) throw new Error(`\u521B\u5EFA\u4EA7\u54C1\u5931\u8D25: ${error.message}`);
  return rowToProduct(data);
}
async function updateProduct(id, updates) {
  const updateData = {
    updated_at: updates.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  if (updates.name !== void 0) updateData.name = updates.name;
  if (updates.sku !== void 0) updateData.sku = updates.sku;
  if (updates.category !== void 0) updateData.category = updates.category;
  if (updates.description !== void 0) updateData.description = updates.description || null;
  if (updates.unitPrice !== void 0) updateData.unit_price = updates.unitPrice;
  if (updates.unit !== void 0) updateData.unit = updates.unit;
  if (updates.cost !== void 0) updateData.cost = updates.cost;
  if (updates.stock !== void 0) updateData.stock = updates.stock;
  if (updates.isActive !== void 0) updateData.is_active = updates.isActive;
  const client = getSupabaseClient();
  const { data, error } = await client.from("products").update(updateData).eq("id", id).select().single();
  if (error) throw new Error(`\u66F4\u65B0\u4EA7\u54C1\u5931\u8D25: ${error.message}`);
  return rowToProduct(data);
}
async function deleteProduct(id) {
  const client = getSupabaseClient();
  const { error } = await client.from("products").delete().eq("id", id);
  if (error) throw new Error(`\u5220\u9664\u4EA7\u54C1\u5931\u8D25: ${error.message}`);
}
async function getAllOpportunities(excludeLead = false) {
  const client = getSupabaseClient();
  let query = client.from("opportunities").select("*").order("updated_at", { ascending: false });
  if (excludeLead) {
    query = query.neq("stage", "lead");
  }
  const { data, error } = await query;
  if (error) throw new Error(`\u83B7\u53D6\u5546\u673A\u5217\u8868\u5931\u8D25: ${error.message}`);
  return data;
}
async function getOpportunityById(id) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("opportunities").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`\u83B7\u53D6\u5546\u673A\u5931\u8D25: ${error.message}`);
  return data;
}
async function createOpportunity(opportunity) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("opportunities").insert(opportunity).select().single();
  if (error) throw new Error(`\u521B\u5EFA\u5546\u673A\u5931\u8D25: ${error.message}`);
  return data;
}
async function updateOpportunity(id, updates) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("opportunities").update({ ...updates, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", id).select().single();
  if (error) throw new Error(`\u66F4\u65B0\u5546\u673A\u5931\u8D25: ${error.message}`);
  return data;
}
async function deleteOpportunity(id) {
  const client = getSupabaseClient();
  const { error } = await client.from("opportunities").delete().eq("id", id);
  if (error) throw new Error(`\u5220\u9664\u5546\u673A\u5931\u8D25: ${error.message}`);
}
async function getActivities(filters = {}) {
  const client = getSupabaseClient();
  const {
    entity_type,
    entity_id,
    type,
    start_date,
    end_date,
    page = 1,
    pageSize = 20
  } = filters;
  let query = client.from("activities").select("*", { count: "exact" });
  if (entity_type) {
    query = query.eq("entity_type", entity_type);
  }
  if (entity_id) {
    query = query.eq("entity_id", entity_id);
  }
  if (type) {
    query = query.eq("type", type);
  }
  if (start_date) {
    query = query.gte("timestamp", start_date);
  }
  if (end_date) {
    query = query.lte("timestamp", end_date);
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.order("timestamp", { ascending: false }).range(from, to);
  if (error) throw new Error(`\u83B7\u53D6\u6D3B\u52A8\u5217\u8868\u5931\u8D25: ${error.message}`);
  const total = count || 0;
  return {
    activities: data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}
async function getDashboardStats() {
  const client = getSupabaseClient();
  const [
    customersResult,
    contactsResult,
    leadsResult,
    opportunitiesResult,
    wonResult,
    activeCustomersResult
  ] = await Promise.all([
    client.from("customers").select("count", { count: "exact" }),
    client.from("contacts").select("count", { count: "exact" }),
    client.from("leads").select("count", { count: "exact" }).neq("status", "disqualified"),
    client.from("opportunities").select("count", { count: "exact" }).neq("stage", "lead"),
    client.from("opportunities").select("count", { count: "exact" }).eq("stage", "closed_won"),
    client.from("customers").select("count", { count: "exact" }).eq("status", "active")
  ]);
  const { data: wonOpps } = await client.from("opportunities").select("value").eq("stage", "closed_won");
  const totalRevenue = wonOpps?.reduce((sum, opp) => sum + Number(opp.value), 0) || 0;
  return {
    totalCustomers: customersResult.count || 0,
    totalContacts: contactsResult.count || 0,
    totalLeads: leadsResult.count || 0,
    totalOpportunities: opportunitiesResult.count || 0,
    totalRevenue,
    wonOpportunities: wonResult.count || 0,
    activeCustomers: activeCustomersResult.count || 0
  };
}
async function getAllQuotes() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("quotes").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`\u83B7\u53D6\u62A5\u4EF7\u5355\u5217\u8868\u5931\u8D25: ${error.message}`);
  return data;
}
async function getQuoteById(id) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("quotes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`\u83B7\u53D6\u62A5\u4EF7\u5355\u5931\u8D25: ${error.message}`);
  if (!data) return null;
  const { data: items } = await client.from("quote_items").select("*").eq("quote_id", id).order("sort_order", { ascending: true });
  return { ...data, items: items || [] };
}
var WORKFLOW_DEDUP_WINDOW_MS = 5 * 60 * 1e3;
function getPeriodStart(timeRange) {
  const now = /* @__PURE__ */ new Date();
  switch (timeRange) {
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1);
    }
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return /* @__PURE__ */ new Date(0);
  }
}
async function getFunnelData(timeRange = "all") {
  const client = getSupabaseClient();
  const periodStartIso = getPeriodStart(timeRange).toISOString();
  const { data, error } = await client.from("opportunities").select("id, stage, value").gte("created_at", periodStartIso);
  if (error) throw new Error(`\u83B7\u53D6\u6F0F\u6597\u6570\u636E\u5931\u8D25: ${error.message}`);
  const stageOrder = ["qualified", "discovery", "proposal", "negotiation", "contract"];
  const stageLabels = {
    qualified: "\u5DF2Qualify",
    discovery: "\u9700\u6C42\u8C03\u7814",
    proposal: "\u65B9\u6848\u62A5\u4EF7",
    negotiation: "\u5546\u52A1\u8C08\u5224",
    contract: "\u5408\u540C\u7B7E\u7F72"
  };
  const items = data || [];
  const baseCount = Math.max(items.length, 1);
  return stageOrder.map((stage, idx) => {
    const matched = items.filter((o) => o.stage === stage);
    const amount = matched.reduce((sum, o) => sum + Number(o.value || 0), 0);
    return {
      stage,
      stageLabel: stageLabels[stage],
      count: matched.length,
      amount,
      avgDays: (idx + 1) * 5,
      conversionRate: matched.length / baseCount * 100
    };
  });
}
async function getAllTasks() {
  const client = getSupabaseClient();
  const { data, error } = await client.from("tasks").select("*").order("due_date", { ascending: true });
  if (error) {
    console.error("\u83B7\u53D6\u4EFB\u52A1\u5217\u8868\u5931\u8D25:", error);
    return [];
  }
  return data?.map(rowToTask) || [];
}
async function getTaskById(id) {
  const client = getSupabaseClient();
  const { data, error } = await client.from("tasks").select("*").eq("id", id).single();
  if (error) {
    console.error("\u83B7\u53D6\u4EFB\u52A1\u8BE6\u60C5\u5931\u8D25:", error);
    return null;
  }
  return data ? rowToTask(data) : null;
}
async function createTask(task) {
  const client = getSupabaseClient();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const { data, error } = await client.from("tasks").insert({
    title: task.title,
    description: task.description,
    type: task.type,
    priority: task.priority,
    status: task.status || "pending",
    assignee_id: task.assigneeId,
    assignee_name: task.assigneeName,
    related_type: task.relatedType,
    related_id: task.relatedId,
    related_name: task.relatedName,
    due_date: task.dueDate,
    created_at: now,
    updated_at: now
  }).select().single();
  if (error) {
    console.error("\u521B\u5EFA\u4EFB\u52A1\u5931\u8D25:", error);
    throw error;
  }
  return rowToTask(data);
}
async function updateTask(id, updates) {
  const client = getSupabaseClient();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updateData = { updated_at: now };
  if (updates.title !== void 0) updateData.title = updates.title;
  if (updates.description !== void 0) updateData.description = updates.description;
  if (updates.type !== void 0) updateData.type = updates.type;
  if (updates.priority !== void 0) updateData.priority = updates.priority;
  if (updates.status !== void 0) updateData.status = updates.status;
  if (updates.assigneeId !== void 0) updateData.assignee_id = updates.assigneeId;
  if (updates.assigneeName !== void 0) updateData.assignee_name = updates.assigneeName;
  if (updates.relatedType !== void 0) updateData.related_type = updates.relatedType;
  if (updates.relatedId !== void 0) updateData.related_id = updates.relatedId;
  if (updates.relatedName !== void 0) updateData.related_name = updates.relatedName;
  if (updates.dueDate !== void 0) updateData.due_date = updates.dueDate;
  const { data, error } = await client.from("tasks").update(updateData).eq("id", id).select().single();
  if (error) {
    console.error("\u66F4\u65B0\u4EFB\u52A1\u5931\u8D25:", error);
    throw error;
  }
  return rowToTask(data);
}
async function completeTask(id) {
  const client = getSupabaseClient();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const { data, error } = await client.from("tasks").update({ status: "completed", completed_at: now, updated_at: now }).eq("id", id).select().single();
  if (error) throw new Error(`\u5B8C\u6210\u4EFB\u52A1\u5931\u8D25: ${error.message}`);
  return rowToTask(data);
}
async function deleteTask(id) {
  const client = getSupabaseClient();
  const { error } = await client.from("tasks").delete().eq("id", id);
  if (error) {
    console.error("\u5220\u9664\u4EFB\u52A1\u5931\u8D25:", error);
    throw error;
  }
}
function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    priority: row.priority,
    status: row.status,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    relatedType: row.related_type,
    relatedId: row.related_id,
    relatedName: row.related_name,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// src/cli/commands/customer.ts
var customerCmd = new import_commander.Command("customer").alias("c").description("Manage customers").addCommand(
  new import_commander.Command("list").alias("ls").description("List all customers").option("-l, --limit <n>", "Limit results", "50").option("--status <status>", "Filter by status").action(async (opts) => {
    try {
      let customers = await getAllCustomers();
      if (opts.status) customers = customers.filter((c2) => c2.status === opts.status);
      customers = customers.slice(0, parseInt(opts.limit, 10));
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(customers, null, 2));
        return;
      }
      printTable(
        [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "company", label: "Company" },
          { key: "status", label: "Status" },
          { key: "industry", label: "Industry" },
          { key: "created_at", label: "Created" }
        ],
        customers.map((c2) => ({
          id: c2.id,
          name: c2.name,
          company: c2.company,
          status: c2.status,
          industry: c2.industry || "\u2014",
          created_at: formatDate(c2.created_at)
        }))
      );
      console.log(`
Total: ${customers.length}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander.Command("show").alias("get").description("Show customer details").argument("<id>", "Customer ID").action(async (id) => {
    try {
      const customer = await getCustomerById(id);
      if (!customer) {
        printError(`Customer not found: ${id}`);
        process.exit(1);
      }
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(customer, null, 2));
        return;
      }
      printObject(
        {
          ID: customer.id,
          Name: customer.name,
          Email: customer.email || "\u2014",
          Phone: customer.phone || "\u2014",
          Company: customer.company,
          Status: customer.status,
          Industry: customer.industry || "\u2014",
          Website: customer.website || "\u2014",
          Address: customer.address || "\u2014",
          Notes: customer.notes || "\u2014",
          Created: formatDate(customer.created_at),
          Updated: formatDate(customer.updated_at)
        },
        "Customer Details"
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander.Command("create").alias("add").description("Create a new customer").requiredOption("--name <name>", "Customer name").requiredOption("--company <company>", "Company name").option("--email <email>", "Email").option("--phone <phone>", "Phone").option("--status <status>", "Status (active/inactive/prospect)", "prospect").option("--industry <industry>", "Industry").option("--website <website>", "Website").option("--address <address>", "Address").option("--notes <notes>", "Notes").action(async (opts) => {
    try {
      const customer = await createCustomer({
        name: opts.name,
        company: opts.company,
        email: opts.email || null,
        phone: opts.phone || null,
        status: opts.status,
        industry: opts.industry || null,
        website: opts.website || null,
        address: opts.address || null,
        notes: opts.notes || null
      });
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(customer, null, 2));
        return;
      }
      printSuccess(`Customer created: ${customer.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander.Command("update").alias("edit").description("Update a customer").argument("<id>", "Customer ID").option("--name <name>", "Name").option("--company <company>", "Company").option("--email <email>", "Email").option("--phone <phone>", "Phone").option("--status <status>", "Status").option("--industry <industry>", "Industry").option("--website <website>", "Website").option("--address <address>", "Address").option("--notes <notes>", "Notes").action(async (id, opts) => {
    try {
      const update = {};
      if (opts.name) update.name = opts.name;
      if (opts.company) update.company = opts.company;
      if (opts.email !== void 0) update.email = opts.email;
      if (opts.phone !== void 0) update.phone = opts.phone;
      if (opts.status) update.status = opts.status;
      if (opts.industry !== void 0) update.industry = opts.industry;
      if (opts.website !== void 0) update.website = opts.website;
      if (opts.address !== void 0) update.address = opts.address;
      if (opts.notes !== void 0) update.notes = opts.notes;
      if (Object.keys(update).length === 0) {
        printError("No fields to update");
        process.exit(1);
      }
      const customer = await updateCustomer(id, update);
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(customer, null, 2));
        return;
      }
      printSuccess(`Customer updated: ${customer.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander.Command("delete").alias("rm").description("Delete a customer").argument("<id>", "Customer ID").option("-f, --force", "Force delete without confirmation").action(async (id, opts) => {
    try {
      if (!opts.force && !getGlobalOptions().quiet) {
        printError("Use --force to confirm deletion");
        process.exit(1);
      }
      await deleteCustomer(id);
      printSuccess(`Customer deleted: ${id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/contact.ts
var import_commander2 = require("commander");
var contactCmd = new import_commander2.Command("contact").alias("co").description("Manage contacts").addCommand(
  new import_commander2.Command("list").alias("ls").description("List all contacts").option("-l, --limit <n>", "Limit results", "50").option("--customer <id>", "Filter by customer ID").action(async (opts) => {
    try {
      let contacts;
      if (opts.customer) {
        contacts = await getContactsByCustomerId(opts.customer);
      } else {
        contacts = await getAllContacts();
      }
      contacts = contacts.slice(0, parseInt(opts.limit, 10));
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(contacts, null, 2));
        return;
      }
      printTable(
        [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "position", label: "Position" },
          { key: "customer_id", label: "Customer" },
          { key: "is_primary", label: "Primary" }
        ],
        contacts.map((c2) => ({
          id: c2.id,
          name: `${c2.first_name} ${c2.last_name}`,
          email: c2.email || "\u2014",
          phone: c2.phone || "\u2014",
          position: c2.position || "\u2014",
          customer_id: c2.customer_id,
          is_primary: c2.is_primary
        }))
      );
      console.log(`
Total: ${contacts.length}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander2.Command("show").alias("get").description("Show contact details").argument("<id>", "Contact ID").action(async (id) => {
    try {
      const contact = await getContactById(id);
      if (!contact) {
        printError(`Contact not found: ${id}`);
        process.exit(1);
      }
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(contact, null, 2));
        return;
      }
      printObject(
        {
          ID: contact.id,
          Name: `${contact.first_name} ${contact.last_name}`,
          Email: contact.email || "\u2014",
          Phone: contact.phone || "\u2014",
          Position: contact.position || "\u2014",
          CustomerID: contact.customer_id,
          IsPrimary: contact.is_primary,
          Created: formatDate(contact.created_at)
        },
        "Contact Details"
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander2.Command("create").alias("add").description("Create a new contact").requiredOption("--firstName <firstName>", "First name").requiredOption("--lastName <lastName>", "Last name").requiredOption("--customerId <customerId>", "Customer ID").option("--email <email>", "Email").option("--phone <phone>", "Phone").option("--position <position>", "Position").option("--isPrimary", "Mark as primary contact", false).action(async (opts) => {
    try {
      const contact = await createContact({
        first_name: opts.firstName,
        last_name: opts.lastName,
        customer_id: opts.customerId,
        email: opts.email || null,
        phone: opts.phone || null,
        position: opts.position || null,
        is_primary: opts.isPrimary
      });
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(contact, null, 2));
        return;
      }
      printSuccess(`Contact created: ${contact.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander2.Command("update").alias("edit").description("Update a contact").argument("<id>", "Contact ID").option("--firstName <firstName>", "First name").option("--lastName <lastName>", "Last name").option("--email <email>", "Email").option("--phone <phone>", "Phone").option("--position <position>", "Position").option("--isPrimary", "Primary status").action(async (id, opts) => {
    try {
      const update = {};
      if (opts.firstName) update.first_name = opts.firstName;
      if (opts.lastName) update.last_name = opts.lastName;
      if (opts.email !== void 0) update.email = opts.email;
      if (opts.phone !== void 0) update.phone = opts.phone;
      if (opts.position !== void 0) update.position = opts.position;
      if (opts.isPrimary !== void 0) update.is_primary = opts.isPrimary;
      if (Object.keys(update).length === 0) {
        printError("No fields to update");
        process.exit(1);
      }
      const contact = await updateContact(id, update);
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(contact, null, 2));
        return;
      }
      printSuccess(`Contact updated: ${contact.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander2.Command("delete").alias("rm").description("Delete a contact").argument("<id>", "Contact ID").option("-f, --force", "Force delete without confirmation").action(async (id, opts) => {
    try {
      if (!opts.force && !getGlobalOptions().quiet) {
        printError("Use --force to confirm deletion");
        process.exit(1);
      }
      await deleteContact(id);
      printSuccess(`Contact deleted: ${id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/lead.ts
var import_commander3 = require("commander");
var leadCmd = new import_commander3.Command("lead").alias("l").description("Manage sales leads").addCommand(
  new import_commander3.Command("list").alias("ls").description("List all leads").option("-l, --limit <n>", "Limit results", "50").option("--status <status>", "Filter by status (new/contacted/qualified/disqualified)").action(async (opts) => {
    try {
      let leads = await getAllLeads();
      if (opts.status) leads = leads.filter((l) => l.status === opts.status);
      leads = leads.slice(0, parseInt(opts.limit, 10));
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(leads, null, 2));
        return;
      }
      printTable(
        [
          { key: "id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "source", label: "Source" },
          { key: "customer_name", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "estimated_value", label: "Value" },
          { key: "created_at", label: "Created" }
        ],
        leads.map((l) => ({
          id: l.id,
          title: l.title,
          source: l.source,
          customer_name: l.customer_name,
          status: l.status,
          estimated_value: formatMoney(l.estimated_value),
          created_at: formatDate(l.created_at)
        }))
      );
      console.log(`
Total: ${leads.length}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander3.Command("show").alias("get").description("Show lead details").argument("<id>", "Lead ID").action(async (id) => {
    try {
      const lead = await getLeadById(id);
      if (!lead) {
        printError(`Lead not found: ${id}`);
        process.exit(1);
      }
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(lead, null, 2));
        return;
      }
      printObject(
        {
          ID: lead.id,
          Title: lead.title,
          Source: lead.source,
          Customer: lead.customer_name,
          CustomerID: lead.customer_id,
          Contact: lead.contact_name || "\u2014",
          Status: lead.status,
          EstimatedValue: formatMoney(lead.estimated_value),
          Probability: `${lead.probability}%`,
          Notes: lead.notes || "\u2014",
          Created: formatDate(lead.created_at)
        },
        "Lead Details"
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander3.Command("create").alias("add").description("Create a new lead").requiredOption("--title <title>", "Lead title").requiredOption("--customerId <customerId>", "Customer ID").requiredOption("--customerName <customerName>", "Customer name").option("--source <source>", "Source (referral/website/cold_call/event/advertisement/other)", "other").option("--contactId <contactId>", "Contact ID").option("--contactName <contactName>", "Contact name").option("--estimatedValue <n>", "Estimated value", "0").option("--probability <n>", "Probability %", "10").option("--status <status>", "Status", "new").option("--notes <notes>", "Notes").action(async (opts) => {
    try {
      const lead = await createLead({
        id: `lead_${Date.now()}`,
        title: opts.title,
        source: opts.source,
        customer_id: opts.customerId,
        customer_name: opts.customerName,
        contact_id: opts.contactId || void 0,
        contact_name: opts.contactName || void 0,
        estimated_value: parseFloat(opts.estimatedValue),
        probability: parseInt(opts.probability, 10),
        status: opts.status,
        notes: opts.notes || void 0
      });
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(lead, null, 2));
        return;
      }
      printSuccess(`Lead created: ${lead.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander3.Command("update").alias("edit").description("Update a lead").argument("<id>", "Lead ID").option("--title <title>", "Title").option("--source <source>", "Source").option("--status <status>", "Status").option("--estimatedValue <n>", "Estimated value").option("--probability <n>", "Probability %").option("--notes <notes>", "Notes").action(async (id, opts) => {
    try {
      const update = {};
      if (opts.title) update.title = opts.title;
      if (opts.source) update.source = opts.source;
      if (opts.status) update.status = opts.status;
      if (opts.estimatedValue !== void 0) update.estimated_value = parseFloat(opts.estimatedValue);
      if (opts.probability !== void 0) update.probability = parseInt(opts.probability, 10);
      if (opts.notes !== void 0) update.notes = opts.notes;
      if (Object.keys(update).length === 0) {
        printError("No fields to update");
        process.exit(1);
      }
      const lead = await updateLead(id, update);
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(lead, null, 2));
        return;
      }
      printSuccess(`Lead updated: ${lead.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander3.Command("qualify").description("Mark lead as qualified").argument("<id>", "Lead ID").action(async (id) => {
    try {
      const lead = await updateLead(id, { status: "qualified" });
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(lead, null, 2));
        return;
      }
      printSuccess(`Lead qualified: ${lead.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander3.Command("disqualify").description("Mark lead as disqualified").argument("<id>", "Lead ID").option("--reason <reason>", "Reason").action(async (id, opts) => {
    try {
      const update = { status: "disqualified" };
      if (opts.reason) update.notes = opts.reason;
      const lead = await updateLead(id, update);
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(lead, null, 2));
        return;
      }
      printSuccess(`Lead disqualified: ${lead.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander3.Command("delete").alias("rm").description("Delete a lead").argument("<id>", "Lead ID").option("-f, --force", "Force delete without confirmation").action(async (id, opts) => {
    try {
      if (!opts.force && !getGlobalOptions().quiet) {
        printError("Use --force to confirm deletion");
        process.exit(1);
      }
      await deleteLead(id);
      printSuccess(`Lead deleted: ${id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/opportunity.ts
var import_commander4 = require("commander");
var VALID_STAGES = ["qualified", "discovery", "proposal", "negotiation", "contract", "closed_won", "closed_lost"];
var opportunityCmd = new import_commander4.Command("opportunity").alias("o").description("Manage opportunities").addCommand(
  new import_commander4.Command("list").alias("ls").description("List all opportunities").option("-l, --limit <n>", "Limit results", "50").option("--stage <stage>", "Filter by stage").option("--customer <id>", "Filter by customer ID").action(async (opts) => {
    try {
      let opps = await getAllOpportunities();
      if (opts.stage) opps = opps.filter((o) => o.stage === opts.stage);
      if (opts.customer) opps = opps.filter((o) => o.customer_id === opts.customer);
      opps = opps.slice(0, parseInt(opts.limit, 10));
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(opps, null, 2));
        return;
      }
      printTable(
        [
          { key: "id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "customer_name", label: "Customer" },
          { key: "stage", label: "Stage" },
          { key: "value", label: "Value" },
          { key: "probability", label: "Probability" },
          { key: "created_at", label: "Created" }
        ],
        opps.map((o) => ({
          id: o.id,
          title: o.title,
          customer_name: o.customer_name,
          stage: o.stage,
          value: formatMoney(o.value),
          probability: `${o.probability}%`,
          created_at: formatDate(o.created_at)
        }))
      );
      console.log(`
Total: ${opps.length}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander4.Command("show").alias("get").description("Show opportunity details").argument("<id>", "Opportunity ID").action(async (id) => {
    try {
      const opp = await getOpportunityById(id);
      if (!opp) {
        printError(`Opportunity not found: ${id}`);
        process.exit(1);
      }
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(opp, null, 2));
        return;
      }
      printObject(
        {
          ID: opp.id,
          Title: opp.title,
          Customer: opp.customer_name,
          CustomerID: opp.customer_id,
          Contact: opp.contact_name || "\u2014",
          Stage: opp.stage,
          Value: formatMoney(opp.value),
          Probability: `${opp.probability}%`,
          ExpectedCloseDate: formatDate(opp.expected_close_date),
          Description: opp.description || "\u2014",
          Notes: opp.notes || "\u2014",
          Created: formatDate(opp.created_at)
        },
        "Opportunity Details"
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander4.Command("create").alias("add").description("Create a new opportunity").requiredOption("--title <title>", "Opportunity title").requiredOption("--customerId <customerId>", "Customer ID").requiredOption("--customerName <customerName>", "Customer name").option("--contactId <contactId>", "Contact ID").option("--contactName <contactName>", "Contact name").option("--value <n>", "Value", "0").option("--stage <stage>", "Stage", "qualified").option("--probability <n>", "Probability %", "20").option("--expectedCloseDate <date>", "Expected close date (YYYY-MM-DD)").option("--description <text>", "Description").option("--notes <notes>", "Notes").option("--sourceLeadId <id>", "Source lead ID").action(async (opts) => {
    try {
      const opp = await createOpportunity({
        title: opts.title,
        customer_id: opts.customerId,
        customer_name: opts.customerName,
        contact_id: opts.contactId || null,
        contact_name: opts.contactName || null,
        value: String(parseFloat(opts.value)),
        stage: opts.stage,
        probability: parseInt(opts.probability, 10),
        expected_close_date: opts.expectedCloseDate ? new Date(opts.expectedCloseDate) : null,
        description: opts.description || null,
        notes: opts.notes || null,
        source_lead_id: opts.sourceLeadId || null
      });
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(opp, null, 2));
        return;
      }
      printSuccess(`Opportunity created: ${opp.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander4.Command("update").alias("edit").description("Update an opportunity").argument("<id>", "Opportunity ID").option("--title <title>", "Title").option("--stage <stage>", `Stage (${VALID_STAGES.join("/")})`).option("--value <n>", "Value").option("--probability <n>", "Probability %").option("--expectedCloseDate <date>", "Expected close date").option("--description <text>", "Description").option("--notes <notes>", "Notes").action(async (id, opts) => {
    try {
      const update = {};
      if (opts.title) update.title = opts.title;
      if (opts.stage) update.stage = opts.stage;
      if (opts.value !== void 0) update.value = String(parseFloat(opts.value));
      if (opts.probability !== void 0) update.probability = parseInt(opts.probability, 10);
      if (opts.expectedCloseDate !== void 0) update.expected_close_date = opts.expectedCloseDate ? new Date(opts.expectedCloseDate) : null;
      if (opts.description !== void 0) update.description = opts.description;
      if (opts.notes !== void 0) update.notes = opts.notes;
      if (Object.keys(update).length === 0) {
        printError("No fields to update");
        process.exit(1);
      }
      const opp = await updateOpportunity(id, update);
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(opp, null, 2));
        return;
      }
      printSuccess(`Opportunity updated: ${opp.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander4.Command("stage").description("Change opportunity stage").argument("<id>", "Opportunity ID").argument("<stage>", `New stage (${VALID_STAGES.join("/")})`).option("--reason <reason>", "Reason (for closed_lost)").action(async (id, stage, opts) => {
    try {
      if (!VALID_STAGES.includes(stage)) {
        printError(`Invalid stage. Valid: ${VALID_STAGES.join(", ")}`);
        process.exit(1);
      }
      const update = { stage };
      if (stage === "closed_lost" && opts.reason) {
        update.notes = opts.reason;
      }
      const opp = await updateOpportunity(id, update);
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(opp, null, 2));
        return;
      }
      printSuccess(`Stage changed to ${stage}: ${opp.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander4.Command("delete").alias("rm").description("Delete an opportunity").argument("<id>", "Opportunity ID").option("-f, --force", "Force delete without confirmation").action(async (id, opts) => {
    try {
      if (!opts.force && !getGlobalOptions().quiet) {
        printError("Use --force to confirm deletion");
        process.exit(1);
      }
      await deleteOpportunity(id);
      printSuccess(`Opportunity deleted: ${id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/product.ts
var import_commander5 = require("commander");
var productCmd = new import_commander5.Command("product").alias("p").description("Manage products").addCommand(
  new import_commander5.Command("list").alias("ls").description("List all products").option("-l, --limit <n>", "Limit results", "50").option("--active", "Show only active products").action(async (opts) => {
    try {
      let products = await getAllProducts();
      if (opts.active) products = products.filter((p) => p.isActive);
      products = products.slice(0, parseInt(opts.limit, 10));
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(products, null, 2));
        return;
      }
      printTable(
        [
          { key: "id", label: "ID" },
          { key: "name", label: "Name" },
          { key: "sku", label: "SKU" },
          { key: "category", label: "Category" },
          { key: "price", label: "Price" },
          { key: "isActive", label: "Active" }
        ],
        products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || "\u2014",
          category: p.category || "\u2014",
          price: formatMoney(p.unitPrice),
          isActive: p.isActive
        }))
      );
      console.log(`
Total: ${products.length}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander5.Command("show").alias("get").description("Show product details").argument("<id>", "Product ID").action(async (id) => {
    try {
      const product = await getProductById(id);
      if (!product) {
        printError(`Product not found: ${id}`);
        process.exit(1);
      }
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(product, null, 2));
        return;
      }
      printObject(
        {
          ID: product.id,
          Name: product.name,
          SKU: product.sku || "\u2014",
          Description: product.description || "\u2014",
          Category: product.category || "\u2014",
          UnitPrice: formatMoney(product.unitPrice),
          Unit: product.unit || "\u2014",
          Cost: formatMoney(product.cost),
          Stock: product.stock ?? "\u2014",
          IsActive: product.isActive,
          Created: formatDate(product.createdAt)
        },
        "Product Details"
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander5.Command("create").alias("add").description("Create a new product").requiredOption("--name <name>", "Product name").requiredOption("--sku <sku>", "SKU code").requiredOption("--category <category>", "Category (software/hardware/service/consulting/other)").requiredOption("--unitPrice <n>", "Unit price").requiredOption("--unit <unit>", "Unit of measure").requiredOption("--cost <n>", "Cost").option("--description <text>", "Description").option("--stock <n>", "Stock quantity", "0").option("--isActive", "Active status", true).action(async (opts) => {
    try {
      const product = await createProduct({
        id: `prod_${Date.now()}`,
        name: opts.name,
        sku: opts.sku,
        category: opts.category,
        description: opts.description || void 0,
        unitPrice: parseFloat(opts.unitPrice),
        unit: opts.unit,
        cost: parseFloat(opts.cost),
        stock: parseInt(opts.stock, 10),
        isActive: opts.isActive
      });
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(product, null, 2));
        return;
      }
      printSuccess(`Product created: ${product.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander5.Command("update").alias("edit").description("Update a product").argument("<id>", "Product ID").option("--name <name>", "Product name").option("--sku <sku>", "SKU code").option("--category <category>", "Category").option("--description <text>", "Description").option("--unitPrice <n>", "Unit price").option("--unit <unit>", "Unit").option("--cost <n>", "Cost").option("--stock <n>", "Stock quantity").option("--isActive", "Active status").action(async (id, opts) => {
    try {
      const update = {};
      if (opts.name) update.name = opts.name;
      if (opts.sku !== void 0) update.sku = opts.sku;
      if (opts.category) update.category = opts.category;
      if (opts.description !== void 0) update.description = opts.description;
      if (opts.unitPrice !== void 0) update.unitPrice = parseFloat(opts.unitPrice);
      if (opts.unit !== void 0) update.unit = opts.unit;
      if (opts.cost !== void 0) update.cost = parseFloat(opts.cost);
      if (opts.stock !== void 0) update.stock = parseInt(opts.stock, 10);
      if (opts.isActive !== void 0) update.isActive = opts.isActive;
      if (Object.keys(update).length === 0) {
        printError("No fields to update");
        process.exit(1);
      }
      const product = await updateProduct(id, update);
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(product, null, 2));
        return;
      }
      printSuccess(`Product updated: ${product.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander5.Command("delete").alias("rm").description("Delete a product").argument("<id>", "Product ID").option("-f, --force", "Force delete without confirmation").action(async (id, opts) => {
    try {
      if (!opts.force && !getGlobalOptions().quiet) {
        printError("Use --force to confirm deletion");
        process.exit(1);
      }
      await deleteProduct(id);
      printSuccess(`Product deleted: ${id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/quote.ts
var import_commander6 = require("commander");
var quoteCmd = new import_commander6.Command("quote").alias("q").description("Manage quotes").addCommand(
  new import_commander6.Command("list").alias("ls").description("List all quotes").option("-l, --limit <n>", "Limit results", "50").option("--status <status>", "Filter by status").action(async (opts) => {
    try {
      let quotes = await getAllQuotes();
      if (opts.status) quotes = quotes.filter((q) => q.status === opts.status);
      quotes = quotes.slice(0, parseInt(opts.limit, 10));
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(quotes, null, 2));
        return;
      }
      printTable(
        [
          { key: "id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "status", label: "Status" },
          { key: "total", label: "Total" },
          { key: "created_at", label: "Created" }
        ],
        quotes.map((q) => ({
          id: q.id,
          title: q.title,
          status: q.status,
          total: formatMoney(q.total),
          created_at: formatDate(q.created_at)
        }))
      );
      console.log(`
Total: ${quotes.length}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander6.Command("show").alias("get").description("Show quote details").argument("<id>", "Quote ID").action(async (id) => {
    try {
      const quote = await getQuoteById(id);
      if (!quote) {
        printError(`Quote not found: ${id}`);
        process.exit(1);
      }
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(quote, null, 2));
        return;
      }
      printObject(
        {
          ID: quote.id,
          Title: quote.title,
          Status: quote.status,
          OpportunityID: quote.opportunity_id || "\u2014",
          Customer: quote.customer_name || "\u2014",
          Version: quote.version,
          RevisionReason: quote.revision_reason || "\u2014",
          Subtotal: formatMoney(quote.subtotal),
          Discount: formatMoney(quote.discount),
          Tax: formatMoney(quote.tax),
          Total: formatMoney(quote.total),
          ValidFrom: formatDate(quote.valid_from),
          ValidUntil: formatDate(quote.valid_until),
          Terms: quote.terms || "\u2014",
          Notes: quote.notes || "\u2014",
          Created: formatDate(quote.created_at)
        },
        "Quote Details"
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/task.ts
var import_commander7 = require("commander");
var taskCmd = new import_commander7.Command("task").alias("t").description("Manage tasks").addCommand(
  new import_commander7.Command("list").alias("ls").description("List all tasks").option("-l, --limit <n>", "Limit results", "50").option("--status <status>", "Filter by status (pending/in_progress/completed/cancelled)").option("--priority <priority>", "Filter by priority (low/medium/high/urgent)").option("--relatedType <type>", "Filter by related type").option("--relatedId <id>", "Filter by related ID").action(async (opts) => {
    try {
      let tasks = await getAllTasks();
      if (opts.status) tasks = tasks.filter((t) => t.status === opts.status);
      if (opts.priority) tasks = tasks.filter((t) => t.priority === opts.priority);
      if (opts.relatedType) tasks = tasks.filter((t) => t.relatedType === opts.relatedType);
      if (opts.relatedId) tasks = tasks.filter((t) => t.relatedId === opts.relatedId);
      tasks = tasks.slice(0, parseInt(opts.limit, 10));
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(tasks, null, 2));
        return;
      }
      printTable(
        [
          { key: "id", label: "ID" },
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "dueDate", label: "Due Date" },
          { key: "relatedType", label: "Related" }
        ],
        tasks.map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          dueDate: formatDate(t.dueDate),
          relatedType: t.relatedType ? `${t.relatedType}:${t.relatedId}` : "\u2014"
        }))
      );
      console.log(`
Total: ${tasks.length}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander7.Command("show").alias("get").description("Show task details").argument("<id>", "Task ID").action(async (id) => {
    try {
      const task = await getTaskById(id);
      if (!task) {
        printError(`Task not found: ${id}`);
        process.exit(1);
      }
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(task, null, 2));
        return;
      }
      printObject(
        {
          ID: task.id,
          Title: task.title,
          Description: task.description || "\u2014",
          Type: task.type,
          Priority: task.priority,
          Status: task.status,
          DueDate: formatDate(task.dueDate),
          CompletedAt: formatDate(task.completedAt),
          Assignee: task.assigneeName || "\u2014",
          RelatedType: task.relatedType || "\u2014",
          RelatedID: task.relatedId || "\u2014",
          Created: formatDate(task.createdAt),
          Updated: formatDate(task.updatedAt)
        },
        "Task Details"
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander7.Command("create").alias("add").description("Create a new task").requiredOption("--title <title>", "Task title").requiredOption("--type <type>", "Type (follow_up/meeting/call/email/demo/proposal/other)").option("--description <text>", "Description").option("--priority <priority>", "Priority (low/medium/high/urgent)", "medium").option("--status <status>", "Status (pending/in_progress/completed/cancelled)", "pending").requiredOption("--dueDate <date>", "Due date (YYYY-MM-DD)").option("--assigneeId <id>", "Assignee ID").option("--assigneeName <name>", "Assignee name").option("--relatedType <type>", "Related entity type").option("--relatedId <id>", "Related entity ID").option("--relatedName <name>", "Related entity name").action(async (opts) => {
    try {
      const task = await createTask({
        title: opts.title,
        type: opts.type,
        description: opts.description || void 0,
        priority: opts.priority,
        status: opts.status,
        dueDate: new Date(opts.dueDate).toISOString(),
        assigneeId: opts.assigneeId || void 0,
        assigneeName: opts.assigneeName || void 0,
        relatedType: opts.relatedType || void 0,
        relatedId: opts.relatedId || void 0,
        relatedName: opts.relatedName || void 0
      });
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(task, null, 2));
        return;
      }
      printSuccess(`Task created: ${task.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander7.Command("complete").description("Mark a task as completed").argument("<id>", "Task ID").action(async (id) => {
    try {
      await completeTask(id);
      printSuccess(`Task completed: ${id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander7.Command("update").alias("edit").description("Update a task").argument("<id>", "Task ID").option("--title <title>", "Title").option("--description <text>", "Description").option("--priority <priority>", "Priority").option("--status <status>", "Status").option("--dueDate <date>", "Due date").option("--type <type>", "Type").action(async (id, opts) => {
    try {
      const update = {};
      if (opts.title) update.title = opts.title;
      if (opts.description !== void 0) update.description = opts.description;
      if (opts.priority) update.priority = opts.priority;
      if (opts.status) update.status = opts.status;
      if (opts.dueDate !== void 0) update.dueDate = opts.dueDate ? new Date(opts.dueDate).toISOString() : null;
      if (opts.type) update.type = opts.type;
      if (Object.keys(update).length === 0) {
        printError("No fields to update");
        process.exit(1);
      }
      const task = await updateTask(id, update);
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(task, null, 2));
        return;
      }
      printSuccess(`Task updated: ${task.id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander7.Command("delete").alias("rm").description("Delete a task").argument("<id>", "Task ID").option("-f, --force", "Force delete without confirmation").action(async (id, opts) => {
    try {
      if (!opts.force && !getGlobalOptions().quiet) {
        printError("Use --force to confirm deletion");
        process.exit(1);
      }
      await deleteTask(id);
      printSuccess(`Task deleted: ${id}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/activity.ts
var import_commander8 = require("commander");
var activityCmd = new import_commander8.Command("activity").alias("act").description("View activity timeline").addCommand(
  new import_commander8.Command("list").alias("ls").description("List recent activities").option("-l, --limit <n>", "Limit results", "20").option("--type <type>", "Filter by type").option("--entity <type>", "Filter by entity type").action(async (opts) => {
    try {
      const result = await getActivities({
        type: opts.type,
        entity_type: opts.entity,
        page: 1,
        pageSize: parseInt(opts.limit, 10)
      });
      const activities = result.activities;
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(activities, null, 2));
        return;
      }
      printTable(
        [
          { key: "timestamp", label: "Time" },
          { key: "type", label: "Type" },
          { key: "entity", label: "Entity" },
          { key: "name", label: "Name" },
          { key: "description", label: "Description" }
        ],
        activities.map((a) => ({
          timestamp: formatDate(a.timestamp),
          type: a.type,
          entity: `${a.entity_type}:${a.entity_id?.slice(0, 8)}...`,
          name: a.entity_name || "\u2014",
          description: a.description || "\u2014"
        }))
      );
      console.log(`
Total: ${activities.length}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/report.ts
var import_commander9 = require("commander");
var reportCmd = new import_commander9.Command("report").alias("r").description("View CRM reports").addCommand(
  new import_commander9.Command("stats").alias("s").description("Show dashboard statistics").action(async () => {
    try {
      const stats = await getDashboardStats();
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(stats, null, 2));
        return;
      }
      printObject(
        {
          "Total Customers": stats.totalCustomers,
          "Total Contacts": stats.totalContacts,
          "Total Leads": stats.totalLeads,
          "Total Opportunities": stats.totalOpportunities,
          "Total Revenue": formatMoney(stats.totalRevenue),
          "Won Opportunities": stats.wonOpportunities,
          "Active Customers": stats.activeCustomers
        },
        "Dashboard Statistics"
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander9.Command("funnel").alias("f").description("Show sales funnel data").option("--range <range>", "Time range (month/quarter/year/all)", "all").action(async (opts) => {
    try {
      const funnel = await getFunnelData(opts.range);
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(funnel, null, 2));
        return;
      }
      const rows = funnel.map((stage) => ({
        stage: stage.stageLabel,
        count: stage.count,
        value: formatMoney(stage.amount),
        rate: `${stage.conversionRate.toFixed(1)}%`
      }));
      printTable(
        [
          { key: "stage", label: "Stage" },
          { key: "count", label: "Count" },
          { key: "value", label: "Value" },
          { key: "rate", label: "Conversion Rate" }
        ],
        rows
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander9.Command("summary").description("Show full CRM summary").option("--range <range>", "Time range (month/quarter/year/all)", "all").action(async (opts) => {
    try {
      const stats = await getDashboardStats();
      const funnel = await getFunnelData(opts.range);
      const summary = {
        stats,
        funnel
      };
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }
      printSuccess("CRM Summary");
      printObject(
        {
          "Total Customers": stats.totalCustomers,
          "Total Contacts": stats.totalContacts,
          "Total Leads": stats.totalLeads,
          "Total Opportunities": stats.totalOpportunities,
          "Total Revenue": formatMoney(stats.totalRevenue),
          "Won Opportunities": stats.wonOpportunities,
          "Active Customers": stats.activeCustomers
        },
        "Statistics"
      );
      console.log();
      const funnelRows = funnel.map((s) => ({
        stage: s.stageLabel,
        count: s.count,
        value: formatMoney(s.amount),
        rate: `${s.conversionRate.toFixed(1)}%`
      }));
      printTable(
        [
          { key: "stage", label: "Stage" },
          { key: "count", label: "Count" },
          { key: "value", label: "Value" },
          { key: "rate", label: "Rate" }
        ],
        funnelRows
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/export.ts
var import_commander10 = require("commander");
var import_fs = __toESM(require("fs"));
function toCsv(rows) {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const lines = rows.map(
    (row) => keys.map((k) => {
      const val = row[k];
      if (val === null || val === void 0) return "";
      const str = String(val).replace(/"/g, '""');
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    }).join(",")
  );
  return [header, ...lines].join("\n");
}
var exportCmd = new import_commander10.Command("export").alias("ex").description("Export CRM data").addCommand(
  new import_commander10.Command("customers").description("Export customers").option("--format <format>", "Output format (json/csv)", "json").option("--output <file>", "Output file path").action(async (opts) => {
    try {
      const customers = await getAllCustomers();
      if (getGlobalOptions().json || opts.format === "json") {
        const out = JSON.stringify(customers, null, 2);
        if (opts.output) {
          import_fs.default.writeFileSync(opts.output, out);
          printSuccess(`Exported ${customers.length} customers to ${opts.output}`);
        } else {
          console.log(out);
        }
      } else {
        const csv = toCsv(customers);
        if (opts.output) {
          import_fs.default.writeFileSync(opts.output, csv);
          printSuccess(`Exported ${customers.length} customers to ${opts.output}`);
        } else {
          console.log(csv);
        }
      }
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander10.Command("contacts").description("Export contacts").option("--format <format>", "Output format (json/csv)", "json").option("--output <file>", "Output file path").action(async (opts) => {
    try {
      const contacts = await getAllContacts();
      if (getGlobalOptions().json || opts.format === "json") {
        const out = JSON.stringify(contacts, null, 2);
        if (opts.output) {
          import_fs.default.writeFileSync(opts.output, out);
          printSuccess(`Exported ${contacts.length} contacts to ${opts.output}`);
        } else {
          console.log(out);
        }
      } else {
        const csv = toCsv(contacts);
        if (opts.output) {
          import_fs.default.writeFileSync(opts.output, csv);
          printSuccess(`Exported ${contacts.length} contacts to ${opts.output}`);
        } else {
          console.log(csv);
        }
      }
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander10.Command("leads").description("Export leads").option("--format <format>", "Output format (json/csv)", "json").option("--output <file>", "Output file path").action(async (opts) => {
    try {
      const leads = await getAllLeads();
      if (getGlobalOptions().json || opts.format === "json") {
        const out = JSON.stringify(leads, null, 2);
        if (opts.output) {
          import_fs.default.writeFileSync(opts.output, out);
          printSuccess(`Exported ${leads.length} leads to ${opts.output}`);
        } else {
          console.log(out);
        }
      } else {
        const csv = toCsv(leads);
        if (opts.output) {
          import_fs.default.writeFileSync(opts.output, csv);
          printSuccess(`Exported ${leads.length} leads to ${opts.output}`);
        } else {
          console.log(csv);
        }
      }
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander10.Command("opportunities").description("Export opportunities").option("--format <format>", "Output format (json/csv)", "json").option("--output <file>", "Output file path").action(async (opts) => {
    try {
      const opps = await getAllOpportunities();
      if (getGlobalOptions().json || opts.format === "json") {
        const out = JSON.stringify(opps, null, 2);
        if (opts.output) {
          import_fs.default.writeFileSync(opts.output, out);
          printSuccess(`Exported ${opps.length} opportunities to ${opts.output}`);
        } else {
          console.log(out);
        }
      } else {
        const csv = toCsv(opps);
        if (opts.output) {
          import_fs.default.writeFileSync(opts.output, csv);
          printSuccess(`Exported ${opps.length} opportunities to ${opts.output}`);
        } else {
          console.log(csv);
        }
      }
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/commands/user.ts
var import_commander11 = require("commander");
var import_supabase_js2 = require("@supabase/supabase-js");
var userCmd = new import_commander11.Command("user").alias("u").description("Manage CRM users (requires admin role)").addCommand(
  new import_commander11.Command("list").alias("ls").description("List all users and their roles").option("-l, --limit <n>", "Limit results", "50").action(async (opts) => {
    try {
      const db = getSupabaseClient();
      const { data: allUserRoles, error } = await db.from("user_roles").select(`
              id,
              user_id,
              roles (
                id,
                name,
                description,
                is_system
              )
            `);
      if (error) {
        printError(`Failed to fetch users: ${error.message}`);
        process.exit(1);
      }
      const usersMap = /* @__PURE__ */ new Map();
      allUserRoles?.forEach((ur) => {
        if (!usersMap.has(ur.user_id)) {
          usersMap.set(ur.user_id, {
            user_id: ur.user_id,
            roles: []
          });
        }
        const entry = usersMap.get(ur.user_id);
        const roleList = Array.isArray(ur.roles) ? ur.roles : ur.roles ? [ur.roles] : [];
        roleList.forEach((r) => entry.roles.push(r.name));
      });
      try {
        const { url } = getSupabaseCredentials();
        const serviceRoleKey = getSupabaseServiceRoleKey();
        if (serviceRoleKey) {
          const adminClient = (0, import_supabase_js2.createClient)(url, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });
          const { data: authUsers } = await adminClient.auth.admin.listUsers();
          authUsers?.users?.forEach((authUser) => {
            const entry = usersMap.get(authUser.id);
            if (entry) {
              entry.email = authUser.email || void 0;
              entry.user_name = authUser.user_metadata?.name || authUser.email?.split("@")[0] || void 0;
            }
          });
        }
      } catch {
      }
      let users = Array.from(usersMap.values());
      users = users.slice(0, parseInt(opts.limit, 10));
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(users, null, 2));
        return;
      }
      printTable(
        [
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "user_id", label: "User ID" },
          { key: "roles", label: "Roles" }
        ],
        users.map((u) => ({
          name: u.user_name || "\u2014",
          email: u.email || "\u2014",
          user_id: u.user_id,
          roles: u.roles.join(", ") || "\u2014"
        }))
      );
      console.log(`
Total: ${users.length}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander11.Command("roles").description("Show roles for a user").argument("<userId>", "User ID").action(async (userId) => {
    try {
      const db = getSupabaseClient();
      const { data, error } = await db.from("user_roles").select(`
              roles (
                id, name, description
              )
            `).eq("user_id", userId);
      if (error) {
        printError(String(error.message));
        process.exit(1);
      }
      const roles = data?.map(
        (r) => r.roles?.[0]
      ).filter(Boolean) || [];
      if (getGlobalOptions().json) {
        console.log(JSON.stringify(roles, null, 2));
        return;
      }
      printObject(
        {
          UserID: userId,
          Roles: roles.map((r) => r.name).join(", ") || "None"
        },
        "User Roles"
      );
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander11.Command("assign").description("Assign a role to a user").argument("<userId>", "User ID").argument("<roleName>", "Role name (admin/sales_manager/sales_rep/guest)").action(async (userId, roleName) => {
    try {
      const db = getSupabaseClient();
      const { data: roleData, error: roleError } = await db.from("roles").select("id").eq("name", roleName).single();
      if (roleError || !roleData) {
        printError(`Role not found: ${roleName}`);
        process.exit(1);
      }
      const { error } = await db.from("user_roles").upsert(
        { user_id: userId, role_id: roleData.id },
        { onConflict: "user_id,role_id" }
      );
      if (error) {
        printError(String(error.message));
        process.exit(1);
      }
      printSuccess(`Assigned role ${roleName} to user ${userId}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
).addCommand(
  new import_commander11.Command("remove").description("Remove a role from a user").argument("<userId>", "User ID").argument("<roleName>", "Role name").action(async (userId, roleName) => {
    try {
      const db = getSupabaseClient();
      const { data: roleData } = await db.from("roles").select("id").eq("name", roleName).single();
      if (!roleData?.id) {
        printError(`Role not found: ${roleName}`);
        process.exit(1);
      }
      const { error } = await db.from("user_roles").delete().eq("user_id", userId).eq("role_id", roleData.id);
      if (error) {
        printError(String(error.message));
        process.exit(1);
      }
      printSuccess(`Removed role ${roleName} from user ${userId}`);
    } catch (err) {
      printError(String(err));
      process.exit(1);
    }
  })
);

// src/cli/index.ts
var program = new import_commander12.Command();
program.name("crm").description(c("CRM CLI \u2014 Agent-friendly command line interface for the CRM system", "bold")).version("1.0.0").option("--json", "Output results as JSON (Agent-friendly)").option("--no-color", "Disable colored output").option("-q, --quiet", "Suppress non-essential output").option("--compact", "Compact table output").hook("preAction", (thisCommand) => {
  const opts = thisCommand.opts();
  setGlobalOptions({
    json: opts.json,
    noColor: opts.noColor,
    quiet: opts.quiet,
    compact: opts.compact
  });
});
program.addCommand(customerCmd);
program.addCommand(contactCmd);
program.addCommand(leadCmd);
program.addCommand(opportunityCmd);
program.addCommand(productCmd);
program.addCommand(quoteCmd);
program.addCommand(taskCmd);
program.addCommand(activityCmd);
program.addCommand(reportCmd);
program.addCommand(exportCmd);
program.addCommand(userCmd);
program.command("guide").description("Show Agent usage guide").action(() => {
  console.log(c(`
\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510
\u2502                   CRM CLI Agent Guide                        \u2502
\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502  Global Options:                                             \u2502
\u2502    --json        Output machine-readable JSON               \u2502
\u2502    --no-color    Disable colors                              \u2502
\u2502    -q, --quiet   Suppress non-essential output               \u2502
\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502  Commands:                                                   \u2502
\u2502    customer      crm customer list --json                   \u2502
\u2502    contact       crm contact list --json                    \u2502
\u2502    lead          crm lead list --status new --json          \u2502
\u2502    opportunity   crm opportunity list --stage qualified      \u2502
\u2502    product       crm product list --json                    \u2502
\u2502    quote         crm quote list --json                      \u2502
\u2502    task          crm task list --status pending --json      \u2502
\u2502    activity      crm activity list --limit 10 --json        \u2502
\u2502    report        crm report stats --json                    \u2502
\u2502    export        crm export customers --format csv           \u2502
\u2502    user          crm user list --json                       \u2502
\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524
\u2502  Quick Examples:                                             \u2502
\u2502    crm customer create --name "Alice" --company "Acme"      \u2502
\u2502    crm lead show lead_xxx --json                            \u2502
\u2502    crm opportunity update opp_xxx --stage closed_won         \u2502
\u2502    crm report funnel --json                                 \u2502
\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518
`, "cyan"));
});
program.parse();
