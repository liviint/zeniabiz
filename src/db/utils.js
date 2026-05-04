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
  const session = await db.getFirstAsync(
    `SELECT * FROM app_session LIMIT 1`
  );

  cachedContext = {
    user_id: session?.user_uuid ?? null,
    company: session?.company_uuid ?? null,
    access_token: session?.access_token ?? null,
    refresh_token: session?.refresh_token ?? null,
    is_authenticated: !!session?.access_token,
  };

  return cachedContext;
}

export function getActiveContextSync() {
  if (!cachedContext) {
    throw new Error("Context not loaded. Call loadActiveContext first.");
  }
  return cachedContext;
}

export async function withTransaction(db, fn) {
  await db.runAsync("BEGIN");

  try {
    const result = await fn();
    await db.runAsync("COMMIT");
    return result;
  } catch (e) {
    await db.runAsync("ROLLBACK");
    throw e;
  }
}
