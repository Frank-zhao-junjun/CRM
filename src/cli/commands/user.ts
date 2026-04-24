import { Command } from 'commander';
import { getSupabaseClient, getSupabaseCredentials, getSupabaseServiceRoleKey } from '@/storage/database/supabase-client.server';
import { createClient } from '@supabase/supabase-js';
import { printTable, printObject, printSuccess, printError, getGlobalOptions } from '../utils/formatter';

export const userCmd = new Command('user')
  .alias('u')
  .description('Manage CRM users (requires admin role)')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all users and their roles')
      .option('-l, --limit <n>', 'Limit results', '50')
      .action(async (opts) => {
        try {
          const db = getSupabaseClient();
          const { data: allUserRoles, error } = await db
            .from('user_roles')
            .select(`
              id,
              user_id,
              roles (
                id,
                name,
                description,
                is_system
              )
            `);

          if (error) {
            printError(`Failed to fetch users: ${error.message}`);
            process.exit(1);
          }

          const usersMap = new Map<string, {
            user_id: string;
            user_name?: string;
            email?: string;
            roles: string[];
          }>();

          (allUserRoles as Array<{
            user_id: string;
            roles: { name: string } | Array<{ name: string }>;
          }>)?.forEach((ur) => {
            if (!usersMap.has(ur.user_id)) {
              usersMap.set(ur.user_id, {
                user_id: ur.user_id,
                roles: [],
              });
            }
            const entry = usersMap.get(ur.user_id)!;
            const roleList = Array.isArray(ur.roles) ? ur.roles : ur.roles ? [ur.roles] : [];
            roleList.forEach((r) => entry.roles.push(r.name));
          });

          // Fetch auth users for names/emails
          try {
            const { url } = getSupabaseCredentials();
            const serviceRoleKey = getSupabaseServiceRoleKey();
            if (serviceRoleKey) {
              const adminClient = createClient(url, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false },
              });
              const { data: authUsers } = await adminClient.auth.admin.listUsers();
              authUsers?.users?.forEach((authUser) => {
                const entry = usersMap.get(authUser.id);
                if (entry) {
                  entry.email = authUser.email || undefined;
                  entry.user_name = authUser.user_metadata?.name || authUser.email?.split('@')[0] || undefined;
                }
              });
            }
          } catch {
            // ignore
          }

          let users = Array.from(usersMap.values());
          users = users.slice(0, parseInt(opts.limit, 10));

          if (getGlobalOptions().json) {
            console.log(JSON.stringify(users, null, 2));
            return;
          }

          printTable(
            [
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'user_id', label: 'User ID' },
              { key: 'roles', label: 'Roles' },
            ],
            users.map((u) => ({
              name: u.user_name || '—',
              email: u.email || '—',
              user_id: u.user_id,
              roles: u.roles.join(', ') || '—',
            }))
          );
          console.log(`\nTotal: ${users.length}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('roles')
      .description('Show roles for a user')
      .argument('<userId>', 'User ID')
      .action(async (userId) => {
        try {
          const db = getSupabaseClient();
          const { data, error } = await db
            .from('user_roles')
            .select(`
              roles (
                id, name, description
              )
            `)
            .eq('user_id', userId);

          if (error) {
            printError(String(error.message));
            process.exit(1);
          }

          const roles = (data as Array<{ roles: Array<{ id: string; name: string; description: string | null }> }>)?.map(
            (r) => r.roles?.[0]
          ).filter(Boolean) || [];

          if (getGlobalOptions().json) {
            console.log(JSON.stringify(roles, null, 2));
            return;
          }

          printObject(
            {
              UserID: userId,
              Roles: roles.map((r) => r.name).join(', ') || 'None',
            },
            'User Roles'
          );
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('assign')
      .description('Assign a role to a user')
      .argument('<userId>', 'User ID')
      .argument('<roleName>', 'Role name (admin/sales_manager/sales_rep/guest)')
      .action(async (userId, roleName) => {
        try {
          const db = getSupabaseClient();
          const { data: roleData, error: roleError } = await db
            .from('roles')
            .select('id')
            .eq('name', roleName)
            .single();

          if (roleError || !roleData) {
            printError(`Role not found: ${roleName}`);
            process.exit(1);
          }

          const { error } = await db.from('user_roles').upsert(
            { user_id: userId, role_id: roleData.id },
            { onConflict: 'user_id,role_id' }
          );

          if (error) {
            printError(String(error.message));
            process.exit(1);
          }

          printSuccess(`Assigned role ${roleName} to user ${userId}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('remove')
      .description('Remove a role from a user')
      .argument('<userId>', 'User ID')
      .argument('<roleName>', 'Role name')
      .action(async (userId, roleName) => {
        try {
          const db = getSupabaseClient();
          const { data: roleData } = await db
            .from('roles')
            .select('id')
            .eq('name', roleName)
            .single();

          if (!roleData?.id) {
            printError(`Role not found: ${roleName}`);
            process.exit(1);
          }

          const { error } = await db
            .from('user_roles')
            .delete()
            .eq('user_id', userId)
            .eq('role_id', roleData.id);

          if (error) {
            printError(String(error.message));
            process.exit(1);
          }

          printSuccess(`Removed role ${roleName} from user ${userId}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  );
