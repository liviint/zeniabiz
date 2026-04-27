export function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export const getMonthStart = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
};

export const getMonthEnd = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
};


export const normalizeStartDate = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1)
    .toISOString()
    .split("T")[0];
};

export const normalizeEndDate = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
    .toISOString()
    .split("T")[0];
};

export const getPeriodRange = (startDate, period) => {
  const start = new Date(startDate);
  let end;

  if (period === "daily") {
    end = new Date(start);
  }

  if (period === "weekly") {
    end = new Date(start);
    end.setDate(end.getDate() + 6);
  }

  if (period === "monthly") {
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  }

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};

let cachedContext = null;

export async function loadActiveContext(db) {
  const user = await db.getFirstAsync(
    `SELECT * FROM local_user LIMIT 1`
  );

  const setting = await db.getFirstAsync(
    `SELECT value FROM app_settings WHERE key = ?`,
    ["active_company_id"]
  );

  cachedContext = {
    user_id: user?.id,
    company_id: setting?.value
  };

  return cachedContext;
}

export function getActiveContextSync() {
  if (!cachedContext) {
    throw new Error("Context not loaded");
  }
  return cachedContext;
}




