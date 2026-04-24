import { Command } from 'commander';
import {
  getAllContacts,
  getContactsByCustomerId,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
} from '@/lib/crm-database';
import { printTable, printObject, printSuccess, printError, getGlobalOptions, formatDate } from '../utils/formatter';

export const contactCmd = new Command('contact')
  .alias('co')
  .description('Manage contacts')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all contacts')
      .option('-l, --limit <n>', 'Limit results', '50')
      .option('--customer <id>', 'Filter by customer ID')
      .action(async (opts) => {
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
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'phone', label: 'Phone' },
              { key: 'position', label: 'Position' },
              { key: 'customer_id', label: 'Customer' },
              { key: 'is_primary', label: 'Primary' },
            ],
            contacts.map((c) => ({
              id: c.id,
              name: `${c.first_name} ${c.last_name}`,
              email: c.email || '—',
              phone: c.phone || '—',
              position: c.position || '—',
              customer_id: c.customer_id,
              is_primary: c.is_primary,
            }))
          );
          console.log(`\nTotal: ${contacts.length}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('show')
      .alias('get')
      .description('Show contact details')
      .argument('<id>', 'Contact ID')
      .action(async (id) => {
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
              Email: contact.email || '—',
              Phone: contact.phone || '—',
              Position: contact.position || '—',
              CustomerID: contact.customer_id,
              IsPrimary: contact.is_primary,
              Created: formatDate(contact.created_at),
            },
            'Contact Details'
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
      .description('Create a new contact')
      .requiredOption('--firstName <firstName>', 'First name')
      .requiredOption('--lastName <lastName>', 'Last name')
      .requiredOption('--customerId <customerId>', 'Customer ID')
      .option('--email <email>', 'Email')
      .option('--phone <phone>', 'Phone')
      .option('--position <position>', 'Position')
      .option('--isPrimary', 'Mark as primary contact', false)
      .action(async (opts) => {
        try {
          const contact = await createContact({
            first_name: opts.firstName,
            last_name: opts.lastName,
            customer_id: opts.customerId,
            email: opts.email || null,
            phone: opts.phone || null,
            position: opts.position || null,
            is_primary: opts.isPrimary,
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
  )
  .addCommand(
    new Command('update')
      .alias('edit')
      .description('Update a contact')
      .argument('<id>', 'Contact ID')
      .option('--firstName <firstName>', 'First name')
      .option('--lastName <lastName>', 'Last name')
      .option('--email <email>', 'Email')
      .option('--phone <phone>', 'Phone')
      .option('--position <position>', 'Position')
      .option('--isPrimary', 'Primary status')
      .action(async (id, opts) => {
        try {
          const update: Record<string, unknown> = {};
          if (opts.firstName) update.first_name = opts.firstName;
          if (opts.lastName) update.last_name = opts.lastName;
          if (opts.email !== undefined) update.email = opts.email;
          if (opts.phone !== undefined) update.phone = opts.phone;
          if (opts.position !== undefined) update.position = opts.position;
          if (opts.isPrimary !== undefined) update.is_primary = opts.isPrimary;

          if (Object.keys(update).length === 0) {
            printError('No fields to update');
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
  )
  .addCommand(
    new Command('delete')
      .alias('rm')
      .description('Delete a contact')
      .argument('<id>', 'Contact ID')
      .option('-f, --force', 'Force delete without confirmation')
      .action(async (id, opts) => {
        try {
          if (!opts.force && !getGlobalOptions().quiet) {
            printError('Use --force to confirm deletion');
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
