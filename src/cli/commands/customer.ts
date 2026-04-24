import { Command } from 'commander';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/lib/crm-database';
import { printTable, printObject, printSuccess, printError, getGlobalOptions, formatDate } from '../utils/formatter';

export const customerCmd = new Command('customer')
  .alias('c')
  .description('Manage customers')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all customers')
      .option('-l, --limit <n>', 'Limit results', '50')
      .option('--status <status>', 'Filter by status')
      .action(async (opts) => {
        try {
          let customers = await getAllCustomers();
          if (opts.status) customers = customers.filter((c) => c.status === opts.status);
          customers = customers.slice(0, parseInt(opts.limit, 10));

          if (getGlobalOptions().json) {
            console.log(JSON.stringify(customers, null, 2));
            return;
          }

          printTable(
            [
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'company', label: 'Company' },
              { key: 'status', label: 'Status' },
              { key: 'industry', label: 'Industry' },
              { key: 'created_at', label: 'Created' },
            ],
            customers.map((c) => ({
              id: c.id,
              name: c.name,
              company: c.company,
              status: c.status,
              industry: c.industry || '—',
              created_at: formatDate(c.created_at),
            }))
          );
          console.log(`\nTotal: ${customers.length}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('show')
      .alias('get')
      .description('Show customer details')
      .argument('<id>', 'Customer ID')
      .action(async (id) => {
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
              Email: customer.email || '—',
              Phone: customer.phone || '—',
              Company: customer.company,
              Status: customer.status,
              Industry: customer.industry || '—',
              Website: customer.website || '—',
              Address: customer.address || '—',
              Notes: customer.notes || '—',
              Created: formatDate(customer.created_at),
              Updated: formatDate(customer.updated_at),
            },
            'Customer Details'
          );
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('create')
      .alias('add')
      .description('Create a new customer')
      .requiredOption('--name <name>', 'Customer name')
      .requiredOption('--company <company>', 'Company name')
      .option('--email <email>', 'Email')
      .option('--phone <phone>', 'Phone')
      .option('--status <status>', 'Status (active/inactive/prospect)', 'prospect')
      .option('--industry <industry>', 'Industry')
      .option('--website <website>', 'Website')
      .option('--address <address>', 'Address')
      .option('--notes <notes>', 'Notes')
      .action(async (opts) => {
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
            notes: opts.notes || null,
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
  )
  .addCommand(
    new Command('update')
      .alias('edit')
      .description('Update a customer')
      .argument('<id>', 'Customer ID')
      .option('--name <name>', 'Name')
      .option('--company <company>', 'Company')
      .option('--email <email>', 'Email')
      .option('--phone <phone>', 'Phone')
      .option('--status <status>', 'Status')
      .option('--industry <industry>', 'Industry')
      .option('--website <website>', 'Website')
      .option('--address <address>', 'Address')
      .option('--notes <notes>', 'Notes')
      .action(async (id, opts) => {
        try {
          const update: Record<string, unknown> = {};
          if (opts.name) update.name = opts.name;
          if (opts.company) update.company = opts.company;
          if (opts.email !== undefined) update.email = opts.email;
          if (opts.phone !== undefined) update.phone = opts.phone;
          if (opts.status) update.status = opts.status;
          if (opts.industry !== undefined) update.industry = opts.industry;
          if (opts.website !== undefined) update.website = opts.website;
          if (opts.address !== undefined) update.address = opts.address;
          if (opts.notes !== undefined) update.notes = opts.notes;

          if (Object.keys(update).length === 0) {
            printError('No fields to update');
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
  )
  .addCommand(
    new Command('delete')
      .alias('rm')
      .description('Delete a customer')
      .argument('<id>', 'Customer ID')
      .option('-f, --force', 'Force delete without confirmation')
      .action(async (id, opts) => {
        try {
          if (!opts.force && !getGlobalOptions().quiet) {
            printError('Use --force to confirm deletion');
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
