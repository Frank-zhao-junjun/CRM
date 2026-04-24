import { Command } from 'commander';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
} from '@/lib/crm-database';
import { printTable, printObject, printSuccess, printError, getGlobalOptions, formatDate } from '../utils/formatter';

export const taskCmd = new Command('task')
  .alias('t')
  .description('Manage tasks')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all tasks')
      .option('-l, --limit <n>', 'Limit results', '50')
      .option('--status <status>', 'Filter by status (pending/in_progress/completed/cancelled)')
      .option('--priority <priority>', 'Filter by priority (low/medium/high/urgent)')
      .option('--relatedType <type>', 'Filter by related type')
      .option('--relatedId <id>', 'Filter by related ID')
      .action(async (opts) => {
        try {
          let tasks = await getAllTasks();
          if (opts.status) tasks = tasks.filter((t) => t.status === opts.status);
          if (opts.priority) tasks = tasks.filter((t) => t.priority === opts.priority);
          if (opts.relatedType) tasks = tasks.filter((t) => t.relatedType === opts.relatedType);
          if (opts.relatedId) tasks = tasks.filter((t) => t.relatedId === opts.relatedId);
          tasks = tasks.slice(0, parseInt(opts.limit, 10));

          if (getGlobalOptions().json) {
            console.log(JSON.stringify(tasks, null, 2));
            return;
          }

          printTable(
            [
              { key: 'id', label: 'ID' },
              { key: 'title', label: 'Title' },
              { key: 'priority', label: 'Priority' },
              { key: 'status', label: 'Status' },
              { key: 'dueDate', label: 'Due Date' },
              { key: 'relatedType', label: 'Related' },
            ],
            tasks.map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              status: t.status,
              dueDate: formatDate(t.dueDate),
              relatedType: t.relatedType ? `${t.relatedType}:${t.relatedId}` : '—',
            }))
          );
          console.log(`\nTotal: ${tasks.length}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('show')
      .alias('get')
      .description('Show task details')
      .argument('<id>', 'Task ID')
      .action(async (id) => {
        try {
          const task = await getTaskById(id);
          if (!task) {
            printError(`Task not found: ${id}`);
            process.exit(1);
          }
          if (getGlobalOptions().json) {
            console.log(JSON.stringify(task, null, 2));
            return;
          }
          printObject(
            {
              ID: task.id,
              Title: task.title,
              Description: task.description || '—',
              Type: task.type,
              Priority: task.priority,
              Status: task.status,
              DueDate: formatDate(task.dueDate),
              CompletedAt: formatDate(task.completedAt),
              Assignee: task.assigneeName || '—',
              RelatedType: task.relatedType || '—',
              RelatedID: task.relatedId || '—',
              Created: formatDate(task.createdAt),
              Updated: formatDate(task.updatedAt),
            },
            'Task Details'
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
      .description('Create a new task')
      .requiredOption('--title <title>', 'Task title')
      .requiredOption('--type <type>', 'Type (follow_up/meeting/call/email/demo/proposal/other)')
      .option('--description <text>', 'Description')
      .option('--priority <priority>', 'Priority (low/medium/high/urgent)', 'medium')
      .option('--status <status>', 'Status (pending/in_progress/completed/cancelled)', 'pending')
      .requiredOption('--dueDate <date>', 'Due date (YYYY-MM-DD)')
      .option('--assigneeId <id>', 'Assignee ID')
      .option('--assigneeName <name>', 'Assignee name')
      .option('--relatedType <type>', 'Related entity type')
      .option('--relatedId <id>', 'Related entity ID')
      .option('--relatedName <name>', 'Related entity name')
      .action(async (opts) => {
        try {
          const task = await createTask({
            title: opts.title,
            type: opts.type,
            description: opts.description || undefined,
            priority: opts.priority,
            status: opts.status,
            dueDate: new Date(opts.dueDate).toISOString(),
            assigneeId: opts.assigneeId || undefined,
            assigneeName: opts.assigneeName || undefined,
            relatedType: opts.relatedType || undefined,
            relatedId: opts.relatedId || undefined,
            relatedName: opts.relatedName || undefined,
          });
          if (getGlobalOptions().json) {
            console.log(JSON.stringify(task, null, 2));
            return;
          }
          printSuccess(`Task created: ${task.id}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('complete')
      .description('Mark a task as completed')
      .argument('<id>', 'Task ID')
      .action(async (id) => {
        try {
          await completeTask(id);
          printSuccess(`Task completed: ${id}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('update')
      .alias('edit')
      .description('Update a task')
      .argument('<id>', 'Task ID')
      .option('--title <title>', 'Title')
      .option('--description <text>', 'Description')
      .option('--priority <priority>', 'Priority')
      .option('--status <status>', 'Status')
      .option('--dueDate <date>', 'Due date')
      .option('--type <type>', 'Type')
      .action(async (id, opts) => {
        try {
          const update: Record<string, unknown> = {};
          if (opts.title) update.title = opts.title;
          if (opts.description !== undefined) update.description = opts.description;
          if (opts.priority) update.priority = opts.priority;
          if (opts.status) update.status = opts.status;
          if (opts.dueDate !== undefined) update.dueDate = opts.dueDate ? new Date(opts.dueDate).toISOString() : null;
          if (opts.type) update.type = opts.type;

          if (Object.keys(update).length === 0) {
            printError('No fields to update');
            process.exit(1);
          }

          const task = await updateTask(id, update);
          if (getGlobalOptions().json) {
            console.log(JSON.stringify(task, null, 2));
            return;
          }
          printSuccess(`Task updated: ${task.id}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('delete')
      .alias('rm')
      .description('Delete a task')
      .argument('<id>', 'Task ID')
      .option('-f, --force', 'Force delete without confirmation')
      .action(async (id, opts) => {
        try {
          if (!opts.force && !getGlobalOptions().quiet) {
            printError('Use --force to confirm deletion');
            process.exit(1);
          }
          await deleteTask(id);
          printSuccess(`Task deleted: ${id}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  );
