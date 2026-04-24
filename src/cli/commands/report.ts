import { Command } from 'commander';
import {
  getDashboardStats,
  getFunnelData,
} from '@/lib/crm-database';
import { printObject, printTable, printSuccess, printError, getGlobalOptions, formatMoney } from '../utils/formatter';

export const reportCmd = new Command('report')
  .alias('r')
  .description('View CRM reports')
  .addCommand(
    new Command('stats')
      .alias('s')
      .description('Show dashboard statistics')
      .action(async () => {
        try {
          const stats = await getDashboardStats();
          if (getGlobalOptions().json) {
            console.log(JSON.stringify(stats, null, 2));
            return;
          }
          printObject(
            {
              'Total Customers': stats.totalCustomers,
              'Total Contacts': stats.totalContacts,
              'Total Leads': stats.totalLeads,
              'Total Opportunities': stats.totalOpportunities,
              'Total Revenue': formatMoney(stats.totalRevenue),
              'Won Opportunities': stats.wonOpportunities,
              'Active Customers': stats.activeCustomers,
            },
            'Dashboard Statistics'
          );
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('funnel')
      .alias('f')
      .description('Show sales funnel data')
      .option('--range <range>', 'Time range (month/quarter/year/all)', 'all')
      .action(async (opts) => {
        try {
          const funnel = await getFunnelData(opts.range as 'month' | 'quarter' | 'year' | 'all');
          if (getGlobalOptions().json) {
            console.log(JSON.stringify(funnel, null, 2));
            return;
          }

          const rows = funnel.map((stage: { stage: string; stageLabel: string; count: number; amount: number; conversionRate: number }) => ({
            stage: stage.stageLabel,
            count: stage.count,
            value: formatMoney(stage.amount),
            rate: `${stage.conversionRate.toFixed(1)}%`,
          }));

          printTable(
            [
              { key: 'stage', label: 'Stage' },
              { key: 'count', label: 'Count' },
              { key: 'value', label: 'Value' },
              { key: 'rate', label: 'Conversion Rate' },
            ],
            rows
          );
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('summary')
      .description('Show full CRM summary')
      .option('--range <range>', 'Time range (month/quarter/year/all)', 'all')
      .action(async (opts) => {
        try {
          const stats = await getDashboardStats();
          const funnel = await getFunnelData(opts.range as 'month' | 'quarter' | 'year' | 'all');
          const summary = {
            stats,
            funnel,
          };
          if (getGlobalOptions().json) {
            console.log(JSON.stringify(summary, null, 2));
            return;
          }
          printSuccess('CRM Summary');
          printObject(
            {
              'Total Customers': stats.totalCustomers,
              'Total Contacts': stats.totalContacts,
              'Total Leads': stats.totalLeads,
              'Total Opportunities': stats.totalOpportunities,
              'Total Revenue': formatMoney(stats.totalRevenue),
              'Won Opportunities': stats.wonOpportunities,
              'Active Customers': stats.activeCustomers,
            },
            'Statistics'
          );
          console.log();
          const funnelRows = funnel.map((s: { stageLabel: string; count: number; amount: number; conversionRate: number }) => ({
            stage: s.stageLabel,
            count: s.count,
            value: formatMoney(s.amount),
            rate: `${s.conversionRate.toFixed(1)}%`,
          }));
          printTable(
            [
              { key: 'stage', label: 'Stage' },
              { key: 'count', label: 'Count' },
              { key: 'value', label: 'Value' },
              { key: 'rate', label: 'Rate' },
            ],
            funnelRows
          );
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  );
