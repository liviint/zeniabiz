export const migrateSalesCreditFieldsV1 = async (db) => {
  try {
    // Add new columns
    await db.execAsync(`
      ALTER TABLE sales ADD COLUMN customer_id TEXT;
    `);
  } catch (error) {
    console.log("customer_id already exists");
  }

  try {
    await db.execAsync(`
      ALTER TABLE sales ADD COLUMN total_amount REAL NOT NULL DEFAULT 0;
    `);
  } catch (error) {
    console.log("total_amount already exists");
  }

  try {
    await db.execAsync(`
      ALTER TABLE sales ADD COLUMN amount_paid REAL NOT NULL DEFAULT 0;
    `);
  } catch (error) {
    console.log("amount_paid already exists");
  }

  try {
    await db.execAsync(`
      ALTER TABLE sales ADD COLUMN balance_due REAL NOT NULL DEFAULT 0;
    `);
  } catch (error) {
    console.log("balance_due already exists");
  }

  try {
    await db.execAsync(`
      ALTER TABLE sales ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'PAID';
    `);
  } catch (error) {
    console.log("payment_status already exists");
  }

  try {
    await db.execAsync(`
      ALTER TABLE sales ADD COLUMN due_date TEXT;
    `);
  } catch (error) {
    console.log("due_date already exists");
  }

  try {
    await db.execAsync(`
      ALTER TABLE sales ADD COLUMN discount REAL NOT NULL DEFAULT 0;
    `);
  } catch (error) {
    console.log("discount already exists");
  }

  try {
    await db.execAsync(`
      ALTER TABLE sales ADD COLUMN discount_type TEXT DEFAULT 'fixed';
    `);
  } catch (error) {
    console.log("discount_type already exists");
  }

  // Backfill old data
  // Existing sales were fully paid historically
  await db.execAsync(`
    UPDATE sales
    SET
      total_amount = amount,
      amount_paid = amount,
      balance_due = 0,
      payment_status = 'PAID'
    WHERE total_amount = 0;
  `);

  console.log("Sales credit migration completed");
};

export const migratePaymentsFromSalesV1 = async (db) => {
  try {
    await db.execAsync(`
      INSERT INTO payments (
        id,
        company,
        created_by,
        updated_by,

        sale_id,
        customer_id,
        payment_type,

        amount,

        payment_method,
        note,

        date,

        created_at,
        updated_at,
        deleted_at
      )
      SELECT
        lower(hex(randomblob(16))) as id,

        s.company,
        s.created_by,
        s.updated_by,

        s.id as sale_id,
        s.customer_id,
        'INITIAL' as payment_type,

        s.amount as amount,

        'legacy' as payment_method,
        'Migrated from legacy sales data' as note,

        s.date,

        s.created_at,
        s.updated_at,
        s.deleted_at

      FROM sales s

      WHERE s.amount IS NOT NULL
      AND s.amount > 0

      AND NOT EXISTS (
        SELECT 1
        FROM payments p
        WHERE p.sale_id = s.id
      );
    `);

    console.log("Payments migration completed");
  } catch (error) {
    console.log("Payments migration failed:", error);
  }
};