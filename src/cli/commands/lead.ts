import { Command } from 'commander';
import {
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} from '@/lib/crm-database';
import { printTable, printObject, printSuccess, printError, getGlobalOptions, formatDate, formatMoney } from '../utils/formatter';

export const leadCmd = new Command('lead')
  .alias('l')
  .description('Manage sales leads')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all leads')
      .option('-l, --limit <n>', 'Limit results', '50')
      .option('--status <status>', 'Filter by status (new/contacted/qualified/disqualified)')
      .action(async (opts) => {
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
              { key: 'id', label: 'ID' },
              { key: 'title', label: 'Title' },
              { key: 'source', label: 'Source' },
              { key: 'customer_name', label: 'Customer' },
              { key: 'status', label: 'Status' },
              { key: 'estimated_value', label: 'Value' },
              { key: 'created_at', label: 'Created' },
            ],
            leads.map((l) => ({
              id: l.id,
              title: l.title,
              source: l.source,
              customer_name: l.customer_name,
              status: l.status,
              estimated_value: formatMoney(l.estimated_value),
              created_at: formatDate(l.created_at),
            }))
          );
          console.log(`\nTotal: ${leads.length}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('show')
      .alias('get')
      .description('Show lead details')
      .argument('<id>', 'Lead ID')
      .action(async (id) => {
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
              Contact: lead.contact_name || '—',
              Status: lead.status,
              EstimatedValue: formatMoney(lead.estimated_value),
              Probability: `${lead.probability}%`,
              Notes: lead.notes || '—',
              Created: formatDate(lead.created_at),
            },
            'Lead Details'
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
      .description('Create a new lead')
      .requiredOption('--title <title>', 'Lead title')
      .requiredOption('--customerId <customerId>', 'Customer ID')
      .requiredOption('--customerName <customerName>', 'Customer name')
      .option('--source <source>', 'Source (referral/website/cold_call/event/advertisement/other)', 'other')
      .option('--contactId <contactId>', 'Contact ID')
      .option('--contactName <contactName>', 'Contact name')
      .option('--estimatedValue <n>', 'Estimated value', '0')
      .option('--probability <n>', 'Probability %', '10')
      .option('--status <status>', 'Status', 'new')
      .option('--notes <notes>', 'Notes')
      .action(async (opts) => {
        try {
          const lead = await createLead({
            id: `lead_${Date.now()}`,
            title: opts.title,
            source: opts.source,
            customer_id: opts.customerId,
            customer_name: opts.customerName,
            contact_id: opts.contactId || undefined,
            contact_name: opts.contactName || undefined,
            estimated_value: parseFloat(opts.estimatedValue),
            probability: parseInt(opts.probability, 10),
            status: opts.status,
            notes: opts.notes || undefined,
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
  )
  .addCommand(
    new Command('update')
      .alias('edit')
      .description('Update a lead')
      .argument('<id>', 'Lead ID')
      .option('--title <title>', 'Title')
      .option('--source <source>', 'Source')
      .option('--status <status>', 'Status')
      .option('--estimatedValue <n>', 'Estimated value')
      .option('--probability <n>', 'Probability %')
      .option('--notes <notes>', 'Notes')
      .action(async (id, opts) => {
        try {
          const update: Record<string, unknown> = {};
          if (opts.title) update.title = opts.title;
          if (opts.source) update.source = opts.source;
          if (opts.status) update.status = opts.status;
          if (opts.estimatedValue !== undefined) update.estimated_value = parseFloat(opts.estimatedValue);
          if (opts.probability !== undefined) update.probability = parseInt(opts.probability, 10);
          if (opts.notes !== undefined) update.notes = opts.notes;

          if (Object.keys(update).length === 0) {
            printError('No fields to update');
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
  )
  .addCommand(
    new Command('qualify')
      .description('Mark lead as qualified')
      .argument('<id>', 'Lead ID')
      .action(async (id) => {
        try {
          const lead = await updateLead(id, { status: 'qualified' });
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
  )
  .addCommand(
    new Command('disqualify')
      .description('Mark lead as disqualified')
      .argument('<id>', 'Lead ID')
      .option('--reason <reason>', 'Reason')
      .action(async (id, opts) => {
        try {
          const update: Record<string, unknown> = { status: 'disqualified' };
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
  )
  .addCommand(
    new Command('delete')
      .alias('rm')
      .description('Delete a lead')
      .argument('<id>', 'Lead ID')
      .option('-f, --force', 'Force delete without confirmation')
      .action(async (id, opts) => {
        try {
          if (!opts.force && !getGlobalOptions().quiet) {
            printError('Use --force to confirm deletion');
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
