export const getCashFlow = async (db) => {
    const result = await db.getAllAsync(`
        SELECT 
            d.date,
            COALESCE(s.revenue, 0) - COALESCE(e.expenses, 0) as net
        FROM (
        -- Get all unique dates from both tables
        SELECT date FROM sales
        UNION
        SELECT date FROM expenses WHERE type='expense'
        ) d
        LEFT JOIN (
        SELECT date, SUM(amount) as revenue
        FROM sales
        GROUP BY date
        ) s ON s.date = d.date
        LEFT JOIN (
        SELECT date, SUM(amount) as expenses
        FROM expenses
        WHERE type='expense' AND deleted_at IS NULL
        GROUP BY date
        ) e ON e.date = d.date
        ORDER BY d.date ASC
        LIMIT 7
    `);

  const labels = result.map((item) =>
    new Date(item.date).getDate().toString()
  );

  const data = result.map((item) => item.net || 0);

  return {
    labels,
    datasets: [{ data }],
  }
}

export const getExpensesBreakDown  = async(db) => {
    return db.getAllAsync(`
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE type='expense' AND deleted_at IS NULL
        GROUP BY category
    `);
}

export async function getFinancialStats(db, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

  // 1. Revenue and Cost (from sales)
  const revenueAndCost = await db.getFirstAsync(
    `
    SELECT 
      COALESCE(SUM(si.price * si.quantity), 0) AS revenue,
      COALESCE(SUM(p.cost_price * si.quantity), 0) AS cost
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE s.deleted_at IS NULL
      AND s.date >= ?
      AND s.date < ?
    `,
    [start, end]
  );

  // 2. Expenses (ONLY real expenses)
  const expenseResult = await db.getFirstAsync(
    `
    SELECT COALESCE(SUM(amount), 0) AS expenses
    FROM expenses
    WHERE type = 'expense'
      AND deleted_at IS NULL
      AND date >= ?
      AND date < ?
    `,
    [start, end]
  );

  // 3. Stock Value
  const stockResult = await db.getFirstAsync(
    `
    SELECT COALESCE(SUM(stock_quantity * cost_price), 0) AS stock_value
    FROM products
    WHERE deleted_at IS NULL
    `
  );

  const revenue = revenueAndCost.revenue;
  const cost = revenueAndCost.cost;
  const expenses = expenseResult.expenses;
  const stockValue = stockResult.stock_value;

  const grossProfit = revenue - cost;
  const netProfit = grossProfit - expenses;

  return {
    revenue,
    cost,
    expenses,
    grossProfit,
    netProfit,
    stockValue,
  };
}