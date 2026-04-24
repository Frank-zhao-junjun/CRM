#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { setGlobalOptions, c } from './utils/formatter';

import { customerCmd } from './commands/customer';
import { contactCmd } from './commands/contact';
import { leadCmd } from './commands/lead';
import { opportunityCmd } from './commands/opportunity';
import { productCmd } from './commands/product';
import { quoteCmd } from './commands/quote';
import { taskCmd } from './commands/task';
import { activityCmd } from './commands/activity';
import { reportCmd } from './commands/report';
import { exportCmd } from './commands/export';
import { userCmd } from './commands/user';

const program = new Command();

program
  .name('crm')
  .description(c('CRM CLI — Agent-friendly command line interface for the CRM system', 'bold'))
  .version('1.0.0')
  .option('--json', 'Output results as JSON (Agent-friendly)')
  .option('--no-color', 'Disable colored output')
  .option('-q, --quiet', 'Suppress non-essential output')
  .option('--compact', 'Compact table output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    setGlobalOptions({
      json: opts.json,
      noColor: opts.noColor,
      quiet: opts.quiet,
      compact: opts.compact,
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

program
  .command('guide')
  .description('Show Agent usage guide')
  .action(() => {
    console.log(c(`
┌─────────────────────────────────────────────────────────────┐
│                   CRM CLI Agent Guide                        │
├─────────────────────────────────────────────────────────────┤
│  Global Options:                                             │
│    --json        Output machine-readable JSON               │
│    --no-color    Disable colors                              │
│    -q, --quiet   Suppress non-essential output               │
├─────────────────────────────────────────────────────────────┤
│  Commands:                                                   │
│    customer      crm customer list --json                   │
│    contact       crm contact list --json                    │
│    lead          crm lead list --status new --json          │
│    opportunity   crm opportunity list --stage qualified      │
│    product       crm product list --json                    │
│    quote         crm quote list --json                      │
│    task          crm task list --status pending --json      │
│    activity      crm activity list --limit 10 --json        │
│    report        crm report stats --json                    │
│    export        crm export customers --format csv           │
│    user          crm user list --json                       │
├─────────────────────────────────────────────────────────────┤
│  Quick Examples:                                             │
│    crm customer create --name "Alice" --company "Acme"      │
│    crm lead show lead_xxx --json                            │
│    crm opportunity update opp_xxx --stage closed_won         │
│    crm report funnel --json                                 │
└─────────────────────────────────────────────────────────────┘
`, 'cyan'));
  });

program.parse();
