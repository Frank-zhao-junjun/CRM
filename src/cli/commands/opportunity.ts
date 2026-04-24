import { Command } from 'commander';
import {
  getAllOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} from '@/lib/crm-database';
import { printTable, printObject, printSuccess, printError, getGlobalOptions, formatDate, formatMoney } from '../utils/formatter';

const VALID_STAGES = ['qualified', 'discovery', 'proposal', 'negotiation', 'contract', 'closed_won', 'closed_lost'];

export const opportunityCmd = new Command('opportunity')
  .alias('o')
  .description('Manage opportunities')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all opportunities')
      .option('-l, --limit <n>', 'Limit results', '50')
      .option('--stage <stage>', 'Filter by stage')
      .option('--customer <id>', 'Filter by customer ID')
      .action(async (opts) => {
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
              { key: 'id', label: 'ID' },
              { key: 'title', label: 'Title' },
              { key: 'customer_name', label: 'Customer' },
              { key: 'stage', label: 'Stage' },
              { key: 'value', label: 'Value' },
              { key: 'probability', label: 'Probability' },
              { key: 'created_at', label: 'Created' },
            ],
            opps.map((o) => ({
              id: o.id,
              title: o.title,
              customer_name: o.customer_name,
              stage: o.stage,
              value: formatMoney(o.value),
              probability: `${o.probability}%`,
              created_at: formatDate(o.created_at),
            }))
          );
          console.log(`\nTotal: ${opps.length}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('show')
      .alias('get')
      .description('Show opportunity details')
      .argument('<id>', 'Opportunity ID')
      .action(async (id) => {
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
              Contact: opp.contact_name || '—',
              Stage: opp.stage,
              Value: formatMoney(opp.value),
              Probability: `${opp.probability}%`,
              ExpectedCloseDate: formatDate(opp.expected_close_date),
              Description: opp.description || '—',
              Notes: opp.notes || '—',
              Created: formatDate(opp.created_at),
            },
            'Opportunity Details'
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
      .description('Create a new opportunity')
      .requiredOption('--title <title>', 'Opportunity title')
      .requiredOption('--customerId <customerId>', 'Customer ID')
      .requiredOption('--customerName <customerName>', 'Customer name')
      .option('--contactId <contactId>', 'Contact ID')
      .option('--contactName <contactName>', 'Contact name')
      .option('--value <n>', 'Value', '0')
      .option('--stage <stage>', 'Stage', 'qualified')
      .option('--probability <n>', 'Probability %', '20')
      .option('--expectedCloseDate <date>', 'Expected close date (YYYY-MM-DD)')
      .option('--description <text>', 'Description')
      .option('--notes <notes>', 'Notes')
      .option('--sourceLeadId <id>', 'Source lead ID')
      .action(async (opts) => {
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
            source_lead_id: opts.sourceLeadId || null,
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
  )
  .addCommand(
    new Command('update')
      .alias('edit')
      .description('Update an opportunity')
      .argument('<id>', 'Opportunity ID')
      .option('--title <title>', 'Title')
      .option('--stage <stage>', `Stage (${VALID_STAGES.join('/')})`)
      .option('--value <n>', 'Value')
      .option('--probability <n>', 'Probability %')
      .option('--expectedCloseDate <date>', 'Expected close date')
      .option('--description <text>', 'Description')
      .option('--notes <notes>', 'Notes')
      .action(async (id, opts) => {
        try {
          const update: Record<string, unknown> = {};
          if (opts.title) update.title = opts.title;
          if (opts.stage) update.stage = opts.stage;
          if (opts.value !== undefined) update.value = String(parseFloat(opts.value));
          if (opts.probability !== undefined) update.probability = parseInt(opts.probability, 10);
          if (opts.expectedCloseDate !== undefined) update.expected_close_date = opts.expectedCloseDate ? new Date(opts.expectedCloseDate) : null;
          if (opts.description !== undefined) update.description = opts.description;
          if (opts.notes !== undefined) update.notes = opts.notes;

          if (Object.keys(update).length === 0) {
            printError('No fields to update');
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
  )
  .addCommand(
    new Command('stage')
      .description('Change opportunity stage')
      .argument('<id>', 'Opportunity ID')
      .argument('<stage>', `New stage (${VALID_STAGES.join('/')})`)
      .option('--reason <reason>', 'Reason (for closed_lost)')
      .action(async (id, stage, opts) => {
        try {
          if (!VALID_STAGES.includes(stage)) {
            printError(`Invalid stage. Valid: ${VALID_STAGES.join(', ')}`);
            process.exit(1);
          }
          const update: Record<string, unknown> = { stage };
          if (stage === 'closed_lost' && opts.reason) {
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
  )
  .addCommand(
    new Command('delete')
      .alias('rm')
      .description('Delete an opportunity')
      .argument('<id>', 'Opportunity ID')
      .option('-f, --force', 'Force delete without confirmation')
      .action(async (id, opts) => {
        try {
          if (!opts.force && !getGlobalOptions().quiet) {
            printError('Use --force to confirm deletion');
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
