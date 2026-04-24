import { Command } from 'commander';
import fs from 'fs';
import {
  getAllCustomers,
  getAllContacts,
  getAllLeads,
  getAllOpportunities,
  getAllProducts,
  getAllTasks,
} from '@/lib/crm-database';
import { printSuccess, printError, getGlobalOptions } from '../utils/formatter';

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const header = keys.join(',');
  const lines = rows.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str}"`;
        }
        return str;
      })
      .join(',')
  );
  return [header, ...lines].join('\n');
}

export const exportCmd = new Command('export')
  .alias('ex')
  .description('Export CRM data')
  .addCommand(
    new Command('customers')
      .description('Export customers')
      .option('--format <format>', 'Output format (json/csv)', 'json')
      .option('--output <file>', 'Output file path')
      .action(async (opts) => {
        try {
          const customers = await getAllCustomers();
          if (getGlobalOptions().json || opts.format === 'json') {
            const out = JSON.stringify(customers, null, 2);
            if (opts.output) {
              fs.writeFileSync(opts.output, out);
              printSuccess(`Exported ${customers.length} customers to ${opts.output}`);
            } else {
              console.log(out);
            }
          } else {
            const csv = toCsv(customers as unknown as Record<string, unknown>[]);
            if (opts.output) {
              fs.writeFileSync(opts.output, csv);
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
  )
  .addCommand(
    new Command('contacts')
      .description('Export contacts')
      .option('--format <format>', 'Output format (json/csv)', 'json')
      .option('--output <file>', 'Output file path')
      .action(async (opts) => {
        try {
          const contacts = await getAllContacts();
          if (getGlobalOptions().json || opts.format === 'json') {
            const out = JSON.stringify(contacts, null, 2);
            if (opts.output) {
              fs.writeFileSync(opts.output, out);
              printSuccess(`Exported ${contacts.length} contacts to ${opts.output}`);
            } else {
              console.log(out);
            }
          } else {
            const csv = toCsv(contacts as unknown as Record<string, unknown>[]);
            if (opts.output) {
              fs.writeFileSync(opts.output, csv);
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
  )
  .addCommand(
    new Command('leads')
      .description('Export leads')
      .option('--format <format>', 'Output format (json/csv)', 'json')
      .option('--output <file>', 'Output file path')
      .action(async (opts) => {
        try {
          const leads = await getAllLeads();
          if (getGlobalOptions().json || opts.format === 'json') {
            const out = JSON.stringify(leads, null, 2);
            if (opts.output) {
              fs.writeFileSync(opts.output, out);
              printSuccess(`Exported ${leads.length} leads to ${opts.output}`);
            } else {
              console.log(out);
            }
          } else {
            const csv = toCsv(leads as unknown as Record<string, unknown>[]);
            if (opts.output) {
              fs.writeFileSync(opts.output, csv);
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
  )
  .addCommand(
    new Command('opportunities')
      .description('Export opportunities')
      .option('--format <format>', 'Output format (json/csv)', 'json')
      .option('--output <file>', 'Output file path')
      .action(async (opts) => {
        try {
          const opps = await getAllOpportunities();
          if (getGlobalOptions().json || opts.format === 'json') {
            const out = JSON.stringify(opps, null, 2);
            if (opts.output) {
              fs.writeFileSync(opts.output, out);
              printSuccess(`Exported ${opps.length} opportunities to ${opts.output}`);
            } else {
              console.log(out);
            }
          } else {
            const csv = toCsv(opps as unknown as Record<string, unknown>[]);
            if (opts.output) {
              fs.writeFileSync(opts.output, csv);
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
