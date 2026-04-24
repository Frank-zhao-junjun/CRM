import { Command } from 'commander';
import { getActivities } from '@/lib/crm-database';
import { printTable, printError, getGlobalOptions, formatDate } from '../utils/formatter';

export const activityCmd = new Command('activity')
  .alias('act')
  .description('View activity timeline')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List recent activities')
      .option('-l, --limit <n>', 'Limit results', '20')
      .option('--type <type>', 'Filter by type')
      .option('--entity <type>', 'Filter by entity type')
      .action(async (opts) => {
        try {
          const result = await getActivities({
            type: opts.type,
            entity_type: opts.entity,
            page: 1,
            pageSize: parseInt(opts.limit, 10),
          });
          const activities = result.activities;

          if (getGlobalOptions().json) {
            console.log(JSON.stringify(activities, null, 2));
            return;
          }

          printTable(
            [
              { key: 'timestamp', label: 'Time' },
              { key: 'type', label: 'Type' },
              { key: 'entity', label: 'Entity' },
              { key: 'name', label: 'Name' },
              { key: 'description', label: 'Description' },
            ],
            activities.map((a) => ({
              timestamp: formatDate(a.timestamp),
              type: a.type,
              entity: `${a.entity_type}:${a.entity_id?.slice(0, 8)}...`,
              name: a.entity_name || '—',
              description: a.description || '—',
            }))
          );
          console.log(`\nTotal: ${activities.length}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  );
