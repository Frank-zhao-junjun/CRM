import { Command } from 'commander';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/crm-database';
import { printTable, printObject, printSuccess, printError, getGlobalOptions, formatDate, formatMoney } from '../utils/formatter';

export const productCmd = new Command('product')
  .alias('p')
  .description('Manage products')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all products')
      .option('-l, --limit <n>', 'Limit results', '50')
      .option('--active', 'Show only active products')
      .action(async (opts) => {
        try {
          let products = await getAllProducts();
          if (opts.active) products = products.filter((p) => p.isActive);
          products = products.slice(0, parseInt(opts.limit, 10));

          if (getGlobalOptions().json) {
            console.log(JSON.stringify(products, null, 2));
            return;
          }

          printTable(
            [
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'sku', label: 'SKU' },
              { key: 'category', label: 'Category' },
              { key: 'price', label: 'Price' },
              { key: 'isActive', label: 'Active' },
            ],
            products.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku || '—',
              category: p.category || '—',
              price: formatMoney(p.unitPrice),
              isActive: p.isActive,
            }))
          );
          console.log(`\nTotal: ${products.length}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('show')
      .alias('get')
      .description('Show product details')
      .argument('<id>', 'Product ID')
      .action(async (id) => {
        try {
          const product = await getProductById(id);
          if (!product) {
            printError(`Product not found: ${id}`);
            process.exit(1);
          }
          if (getGlobalOptions().json) {
            console.log(JSON.stringify(product, null, 2));
            return;
          }
          printObject(
            {
              ID: product.id,
              Name: product.name,
              SKU: product.sku || '—',
              Description: product.description || '—',
              Category: product.category || '—',
              UnitPrice: formatMoney(product.unitPrice),
              Unit: product.unit || '—',
              Cost: formatMoney(product.cost),
              Stock: product.stock ?? '—',
              IsActive: product.isActive,
              Created: formatDate(product.createdAt),
            },
            'Product Details'
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
      .description('Create a new product')
      .requiredOption('--name <name>', 'Product name')
      .requiredOption('--sku <sku>', 'SKU code')
      .requiredOption('--category <category>', 'Category (software/hardware/service/consulting/other)')
      .requiredOption('--unitPrice <n>', 'Unit price')
      .requiredOption('--unit <unit>', 'Unit of measure')
      .requiredOption('--cost <n>', 'Cost')
      .option('--description <text>', 'Description')
      .option('--stock <n>', 'Stock quantity', '0')
      .option('--isActive', 'Active status', true)
      .action(async (opts) => {
        try {
          const product = await createProduct({
            id: `prod_${Date.now()}`,
            name: opts.name,
            sku: opts.sku,
            category: opts.category,
            description: opts.description || undefined,
            unitPrice: parseFloat(opts.unitPrice),
            unit: opts.unit,
            cost: parseFloat(opts.cost),
            stock: parseInt(opts.stock, 10),
            isActive: opts.isActive,
          });
          if (getGlobalOptions().json) {
            console.log(JSON.stringify(product, null, 2));
            return;
          }
          printSuccess(`Product created: ${product.id}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('update')
      .alias('edit')
      .description('Update a product')
      .argument('<id>', 'Product ID')
      .option('--name <name>', 'Product name')
      .option('--sku <sku>', 'SKU code')
      .option('--category <category>', 'Category')
      .option('--description <text>', 'Description')
      .option('--unitPrice <n>', 'Unit price')
      .option('--unit <unit>', 'Unit')
      .option('--cost <n>', 'Cost')
      .option('--stock <n>', 'Stock quantity')
      .option('--isActive', 'Active status')
      .action(async (id, opts) => {
        try {
          const update: Record<string, unknown> = {};
          if (opts.name) update.name = opts.name;
          if (opts.sku !== undefined) update.sku = opts.sku;
          if (opts.category) update.category = opts.category;
          if (opts.description !== undefined) update.description = opts.description;
          if (opts.unitPrice !== undefined) update.unitPrice = parseFloat(opts.unitPrice);
          if (opts.unit !== undefined) update.unit = opts.unit;
          if (opts.cost !== undefined) update.cost = parseFloat(opts.cost);
          if (opts.stock !== undefined) update.stock = parseInt(opts.stock, 10);
          if (opts.isActive !== undefined) update.isActive = opts.isActive;

          if (Object.keys(update).length === 0) {
            printError('No fields to update');
            process.exit(1);
          }

          const product = await updateProduct(id, update);
          if (getGlobalOptions().json) {
            console.log(JSON.stringify(product, null, 2));
            return;
          }
          printSuccess(`Product updated: ${product.id}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('delete')
      .alias('rm')
      .description('Delete a product')
      .argument('<id>', 'Product ID')
      .option('-f, --force', 'Force delete without confirmation')
      .action(async (id, opts) => {
        try {
          if (!opts.force && !getGlobalOptions().quiet) {
            printError('Use --force to confirm deletion');
            process.exit(1);
          }
          await deleteProduct(id);
          printSuccess(`Product deleted: ${id}`);
        } catch (err) {
          printError(String(err));
          process.exit(1);
        }
      })
  );
