import { normalizeRange } from "../utils/timeNavigatorHelpers";
import { getTotalStockValue } from "./inventoryDb";
import { getCahsCollcted } from "./paymentsDb";
import { getActiveContextSync } from "./utils";

export const getCashFlow = async (db, timeState) => {
  const { company } = getActiveContextSync();
  const { startDate, endDate } = normalizeRange(timeState);

  const today = new Date()
  today.setHours(0,0,0,0)
  today.setDate(today.getDate() + 1)
  const nomalizedEnd = new Date(endDate)
  const finalEndDate = nomalizedEnd > today ? today.toISOString() : endDate

  const result = await db.getAllAsync(
    `
    SELECT 
      d.date,
      COALESCE(s.revenue, 0) - COALESCE(e.expenses, 0) as net
    FROM (
      SELECT DATE(date) as date 
      FROM sales
      WHERE date >= ?
        AND date < ?
        AND company = ?
        AND deleted_at IS NULL

      UNION

      SELECT DATE(date) as date 
      FROM expenses
      WHERE date >= ?
        AND date < ?
        AND company = ?
        AND deleted_at IS NULL
    ) d

    LEFT JOIN (
      SELECT DATE(date) as date, SUM(amount) as revenue
      FROM sales
      WHERE date >= ?
        AND date < ?
        AND company = ?
        AND deleted_at IS NULL
      GROUP BY DATE(date)
    ) s ON s.date = d.date

    LEFT JOIN (
      SELECT DATE(date) as date, SUM(amount) as expenses
      FROM expenses
      WHERE date >= ?
        AND date < ?
        AND company = ?
        AND deleted_at IS NULL
      GROUP BY DATE(date)
    ) e ON e.date = d.date

    ORDER BY d.date ASC
    `,
    [
      startDate, finalEndDate, company,
      startDate, finalEndDate, company,
      startDate, finalEndDate, company,
      startDate, finalEndDate, company,
    ]
  );

  //NORMALIZE DATA

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
  const end = new Date(finalEndDate);

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
  const { company } = getActiveContextSync();

  const { startDate, endDate } = normalizeRange(timeState);

  if (!startDate || !endDate) {
    throw new Error("Invalid time range");
  }

  const result = await db.getAllAsync(
    `
    SELECT 
      ec.id as category_id,
      ec.name as category,
      SUM(e.amount) as total

    FROM expenses e

    LEFT JOIN expense_categories ec 
      ON ec.id = e.category_id
      AND ec.company = ?
      AND ec.deleted_at IS NULL

    WHERE e.deleted_at IS NULL
      AND e.company = ?
      AND e.date >= ?
      AND e.date < ?

    GROUP BY ec.id, ec.name

    ORDER BY total DESC
    `,
    [
      company,
      company,
      startDate,
      endDate
    ]
  );

  return result;
};

export async function getFinancialStats(db, timeState) {
  const { company } = getActiveContextSync();

  const { startDate, endDate } = normalizeRange(timeState);

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

    JOIN sales s 
      ON s.id = si.sale_id
      AND s.company = ?
      AND s.deleted_at IS NULL

    WHERE si.company = ?
      AND si.deleted_at IS NULL
      AND s.date >= ?
      AND s.date < ?
    `,
    [company, company, startDate, endDate]
  );


  const discountResult = await db.getFirstAsync(
    `
    SELECT
      COALESCE(SUM(discount), 0) AS discounts

    FROM sales

    WHERE company = ?
      AND deleted_at IS NULL
      AND date >= ?
      AND date < ?
    `,
    [company, startDate, endDate]
  );
  // -------------------------
  // 2. Cash Collected
  // -------------------------

  const paymentsResult = await getCahsCollcted(db,timeState)


  // -------------------------
  // 3. Outstanding Credit
  // -------------------------

  const outstandingResult = await db.getFirstAsync(
    `
    SELECT
      COALESCE(SUM(balance_due), 0) AS outstandingCredit

    FROM sales

    WHERE deleted_at IS NULL
      AND company = ?
      AND date >= ?
      AND date < ?
    `,
    [company,startDate, endDate]
  );

  // -------------------------
  // 4. Expenses
  // -------------------------

  const expenseResult = await db.getFirstAsync(
    `
    SELECT 
      COALESCE(SUM(amount), 0) AS expenses

    FROM expenses

    WHERE deleted_at IS NULL
      AND company = ?
      AND date >= ?
      AND date < ?
    `,
    [company, startDate, endDate]
  );

  const revenue = (revenueAndCost?.revenue - discountResult?.discounts) || 0 ;

  const cost = revenueAndCost?.cost || 0;

  const cashCollected =
    paymentsResult?.cashCollected || 0;

  const outstandingCredit =
    outstandingResult?.outstandingCredit || 0;

  const expenses = expenseResult?.expenses || 0;

  // -------------------------
  // 7. Profit Calculations
  // -------------------------

  const grossProfit = revenue - cost;

  const netProfit = grossProfit - expenses;

  let availableCash = cashCollected - expenses
  
  return {
    revenue,
    cashCollected,
    outstandingCredit,
    availableCash,

    cost,
    expenses,

    grossProfit,
    netProfit,
  };
}