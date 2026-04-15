import { normalizeStartDate, normalizeEndDate } from "./utils"

export const getCashFlow = async (db, selectedMonth) => {
  const startDate = normalizeStartDate(selectedMonth);
  const endDate = normalizeEndDate(selectedMonth);

  const result = await db.getAllAsync(
    `
    SELECT 
      d.date,
      COALESCE(s.revenue, 0) - COALESCE(e.expenses, 0) as net
    FROM (
      SELECT DATE(date) as date FROM sales
      WHERE DATE(date) >= DATE(?) AND DATE(date) < DATE(?)

      UNION

      SELECT DATE(date) as date FROM expenses
      WHERE DATE(date) >= DATE(?) AND DATE(date) < DATE(?) 
      AND deleted_at IS NULL
    ) d

    LEFT JOIN (
      SELECT DATE(date) as date, SUM(amount) as revenue
      FROM sales
      WHERE DATE(date) >= DATE(?) AND DATE(date) < DATE(?)
      GROUP BY DATE(date)
    ) s ON s.date = d.date

    LEFT JOIN (
      SELECT DATE(date) as date, SUM(amount) as expenses
      FROM expenses
      WHERE DATE(date) >= DATE(?) AND DATE(date) < DATE(?) 
      AND deleted_at IS NULL
      GROUP BY DATE(date)
    ) e ON e.date = d.date

    ORDER BY d.date ASC
    `,
    [
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
      startDate, endDate,
    ]
  );

const daysInMonth = new Date(
  selectedMonth.getFullYear(),
  selectedMonth.getMonth() + 1,
  0
).getDate();

// Create O(1) lookup
const dataMap = {};
result.forEach((item) => {
  const day = new Date(item.date).getDate();
  dataMap[day] = item.net || 0;
});

const useWeekly = daysInMonth > 10;

if (!useWeekly) {
  // ✅ DAILY (for small ranges)
  const labels = [];
  const data = [];

  for (let day = 1; day <= daysInMonth; day++) {
    labels.push(day.toString());
    data.push(dataMap[day] ?? 0);
  }

  return {
    labels,
    datasets: [{ data }],
  };
}

// ✅ WEEKLY (premium view)
const labels = [];
const data = [];

for (let i = 1; i <= daysInMonth; i += 7) {
  let sum = 0;
  const start = i;
  const end = Math.min(i + 6, daysInMonth);

  for (let d = start; d <= end; d++) {
    sum += dataMap[d] ?? 0;
  }

  labels.push(`${start}-${end}`);
  data.push(sum);
}

return {
  labels,
  datasets: [{ data }],
};
};

export const getExpensesBreakDown = async (db, selectedMonth) => {
  const startDate = normalizeStartDate(selectedMonth);
  const endDate = normalizeEndDate(selectedMonth);

  const result = await db.getAllAsync(
    `
    SELECT category, SUM(amount) as total
    FROM expenses
    WHERE deleted_at IS NULL
      AND DATE(date) >= DATE(?)
      AND DATE(date) < DATE(?)
    GROUP BY category
    ORDER BY total DESC
    `,
    [startDate, endDate]
  );

  return result;
};

export async function getFinancialStats(db, selectedMonth) {
  const startDate = normalizeStartDate(selectedMonth);
  const endDate = normalizeEndDate(selectedMonth);

  // 1. Revenue & Cost
  const revenueAndCost = await db.getFirstAsync(
    `
    SELECT 
      COALESCE(SUM(si.price * si.quantity), 0) AS revenue,
      COALESCE(SUM(p.cost_price * si.quantity), 0) AS cost
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN products p ON p.id = si.product_id
    WHERE s.deleted_at IS NULL
      AND DATE(s.date) >= DATE(?)
      AND DATE(s.date) < DATE(?)
    `,
    [startDate, endDate]
  );

  // 2. Expenses
  const expenseResult = await db.getFirstAsync(
    `
    SELECT COALESCE(SUM(amount), 0) AS expenses
    FROM expenses
    WHERE deleted_at IS NULL
      AND DATE(date) >= DATE(?)
      AND DATE(date) < DATE(?)
    `,
    [startDate, endDate]
  );

  // 3. Stock Value (not time-based)
  const stockResult = await db.getFirstAsync(
    `
    SELECT COALESCE(SUM(stock_quantity * cost_price), 0) AS stock_value
    FROM products
    WHERE deleted_at IS NULL
    `
  );

  const revenue = revenueAndCost?.revenue || 0;
  const cost = revenueAndCost?.cost || 0;
  const expenses = expenseResult?.expenses || 0;
  const stockValue = stockResult?.stock_value || 0;

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