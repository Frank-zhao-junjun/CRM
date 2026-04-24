import chalk from 'chalk';
import Table from 'cli-table3';

export interface OutputOptions {
  json?: boolean;
  noColor?: boolean;
  quiet?: boolean;
  compact?: boolean;
}

let globalOptions: OutputOptions = {};

export function setGlobalOptions(opts: OutputOptions) {
  globalOptions = opts;
}

export function getGlobalOptions(): OutputOptions {
  return globalOptions;
}

export function c(text: string, color: 'red' | 'green' | 'yellow' | 'blue' | 'cyan' | 'gray' | 'white' | 'bold' = 'white'): string {
  if (globalOptions.noColor || globalOptions.json) return text;
  const map: Record<string, (t: string) => string> = {
    red: chalk.red,
    green: chalk.green,
    yellow: chalk.yellow,
    blue: chalk.blue,
    cyan: chalk.cyan,
    gray: chalk.gray,
    white: chalk.white,
    bold: chalk.bold,
  };
  return (map[color] || chalk.white)(text);
}

export function print(data: unknown, options?: OutputOptions) {
  const opts = options || globalOptions;
  if (opts.quiet) return;
  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
  } else if (typeof data === 'string') {
    console.log(data);
  } else {
    console.log(data);
  }
}

export function printTable<T extends Record<string, unknown>>(
  headers: { key: string; label: string; width?: number }[],
  rows: T[],
  options?: OutputOptions
) {
  const opts = options || globalOptions;
  if (opts.quiet) return;

  if (opts.json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  if (rows.length === 0) {
    console.log(c('No records found.', 'gray'));
    return;
  }

  const head = headers.map((h) => c(h.label, 'bold'));
  const table = new Table({
    head,
    style: opts.noColor ? undefined : { head: [], border: [] },
    wordWrap: true,
    wrapOnWordBoundary: true,
  });

  for (const row of rows) {
    const cells = headers.map((h) => {
      const val = row[h.key];
      if (val === null || val === undefined) return c('—', 'gray');
      if (typeof val === 'boolean') return val ? c('Yes', 'green') : c('No', 'red');
      return String(val);
    });
    table.push(cells);
  }

  console.log(table.toString());
}

export function printSuccess(message: string) {
  if (globalOptions.quiet) return;
  console.log(c(`✓ ${message}`, 'green'));
}

export function printError(message: string) {
  if (globalOptions.quiet) return;
  console.error(c(`✗ ${message}`, 'red'));
}

export function printWarning(message: string) {
  if (globalOptions.quiet) return;
  console.log(c(`⚠ ${message}`, 'yellow'));
}

export function printInfo(message: string) {
  if (globalOptions.quiet) return;
  console.log(c(`ℹ ${message}`, 'cyan'));
}

export function printObject(obj: Record<string, unknown>, title?: string) {
  if (globalOptions.quiet) return;
  if (globalOptions.json) {
    console.log(JSON.stringify(obj, null, 2));
    return;
  }

  if (title) {
    console.log(c(`\n${title}`, 'bold'));
    console.log(c('─'.repeat(title.length + 2), 'gray'));
  }

  const maxKeyLen = Math.max(...Object.keys(obj).map((k) => k.length));
  for (const [key, val] of Object.entries(obj)) {
    const paddedKey = key.padEnd(maxKeyLen);
    let displayVal: string;
    if (val === null || val === undefined) displayVal = c('—', 'gray');
    else if (typeof val === 'boolean') displayVal = val ? c('Yes', 'green') : c('No', 'red');
    else displayVal = String(val);
    console.log(`  ${c(paddedKey, 'bold')}: ${displayVal}`);
  }
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 10);
}

export function formatMoney(amount: number | string | null | undefined, currency = 'CNY'): string {
  if (amount === null || amount === undefined) return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';
  const symbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : currency;
  return `${symbol}${num.toLocaleString('zh-CN')}`;
}
