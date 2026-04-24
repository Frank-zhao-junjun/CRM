import { Command } from 'commander';
import {
  getAllQuotes,
  getQuoteById,
} from '@/lib/crm-database';
import { printTable, printObject, printSuccess, printError, getGlobalOptions, formatDate, formatMoney } from '../utils/formatter';

export const quoteCmd = new Command('quote')
  .alias('q')
  .description('Manage quotes')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all quotes')
      .option('-l, --limit <n>', 'Limit results', '50')
      .option('--status <status>', 'Filter by status')
      .action(async (opts) => {
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
              { key: 'id', label: 'ID' },
              { key: 'title', label: 'Title' },
              { key: 'status', label: 'Status' },
              { key: 'total', label: 'Total' },
              { key: 'created_at', label: 'Created' },
            ],
            quotes.map((q) => ({
              id: q.id,
              title: q.title,
              status: q.status,
              total: formatMoney(q.total),
              created_at: formatDate(q.created_at),
            }))
          );
          console.log(`\nTotal: ${quotes.length}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('show')
      .alias('get')
      .description('Show quote details')
      .argument('<id>', 'Quote ID')
      .action(async (id) => {
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
              OpportunityID: quote.opportunity_id || '—',
              Customer: quote.customer_name || '—',
              Version: quote.version,
              RevisionReason: quote.revision_reason || '—',
              Subtotal: formatMoney(quote.subtotal),
              Discount: formatMoney(quote.discount),
              Tax: formatMoney(quote.tax),
              Total: formatMoney(quote.total),
              ValidFrom: formatDate(quote.valid_from),
              ValidUntil: formatDate(quote.valid_until),
              Terms: quote.terms || '—',
              Notes: quote.notes || '—',
              Created: formatDate(quote.created_at),
            },
            'Quote Details'
          );
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  );
