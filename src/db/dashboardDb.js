import { normalizeRange } from "../utils/timeNavigatorHelpers";

export const getCashFlow = async (db, timeState) => {
  const { startDate, endDate } = normalizeRange(timeState)

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

  // -------------------------------
  // 🔥 NORMALIZE DATA (IMPORTANT)
  // -------------------------------

  const dataMap = {};

  result.forEach((item) => {
    // Use FULL DATE as key (not day number)
    const key = item.date; // YYYY-MM-DD from SQLite

    dataMap[key] = item.net || 0;
  });

  // -------------------------------
  // RANGE SETUP
  // -------------------------------

  const start = new Date(startDate);
  const end = new Date(endDate);

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(
    1,
    Math.ceil((end - start) / msPerDay)
  );

  const isSmallRange = totalDays <= 10;
  const isMediumRange = totalDays <= 60;

  // -------------------------------
  // HELPERS
  // -------------------------------

  const formatKey = (d) =>
    d.toISOString().split("T")[0];

  // -------------------------------
  // 📊 CASE 1: DAILY VIEW
  // -------------------------------

  if (isSmallRange) {
    const labels = [];
    const data = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const key = formatKey(d);

      labels.push(d.getDate().toString());
      data.push(dataMap[key] ?? 0);
    }

    return {
      labels,
      datasets: [{ data }],
    };
  }

  // -------------------------------
  // 📊 CASE 2: WEEKLY VIEW
  // -------------------------------

  if (isMediumRange) {
    const labels = [];
    const data = [];

    let current = new Date(start);

    while (current <= end) {
      let sum = 0;

      const weekStart = new Date(current);

      for (let i = 0; i < 7 && current <= end; i++) {
        const key = formatKey(current);
        sum += dataMap[key] ?? 0;

        current.setDate(current.getDate() + 1);
      }

      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() - 1);

      labels.push(
        `${weekStart.getDate()}-${weekEnd.getDate()}`
      );
      data.push(sum);
    }

    return {
      labels,
      datasets: [{ data }],
    };
  }

  // -------------------------------
  // 📊 CASE 3: LARGE RANGE (SIMPLE)
  // -------------------------------

  const total = Object.values(dataMap).reduce(
    (a, b) => a + b,
    0
  );

  return {
    labels: ["Total"],
    datasets: [{ data: [total] }],
  };
};

export const getExpensesBreakDown = async (db, timeState) => {
  const { startDate, endDate } = normalizeRange(timeState)
  console.log(timeState,startDate,endDate,"hello dates")
  if (!startDate || !endDate) {
    throw new Error("Invalid time range");
  }

  const result = await db.getAllAsync(
    `
    SELECT 
      category, 
      SUM(amount) as total
    FROM expenses
    WHERE deleted_at IS NULL
      AND date >= ?
      AND date < ?
    GROUP BY category
    ORDER BY total DESC
    `,
    [startDate, endDate]
  );

  return result;
};

export async function getFinancialStats(db, timeState) {
  const { startDate, endDate } = normalizeRange(timeState)

  if (!startDate || !endDate) {
    throw new Error("Invalid time range");
  }

  // -------------------------
  // 1. Revenue & Cost
  // -------------------------
  const revenueAndCost = await db.getFirstAsync(
    `
    SELECT 
      COALESCE(SUM(si.price * si.quantity), 0) AS revenue,
      COALESCE(SUM(si.cost_price * si.quantity), 0) AS cost
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE s.deleted_at IS NULL
      AND s.date >= ?
      AND s.date < ?
    `,
    [startDate, endDate]
  );

  // -------------------------
  // 2. Expenses
  // -------------------------
  const expenseResult = await db.getFirstAsync(
    `
    SELECT COALESCE(SUM(amount), 0) AS expenses
    FROM expenses
    WHERE deleted_at IS NULL
      AND date >= ?
      AND date < ?
    `,
    [startDate, endDate]
  );

  // -------------------------
  // 3. Stock (NOT time-based)
  // -------------------------
  const stockResult = await db.getFirstAsync(
    `
    SELECT 
      COALESCE(SUM(quantity_remaining * cost_price), 0) AS stock_value
    FROM inventory_batches
    WHERE quantity_remaining > 0
    `
  );

  // -------------------------
  // 4. Safe extraction
  // -------------------------
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