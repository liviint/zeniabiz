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




