export const startOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const endOfDay = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

export const startOfWeek = (d) => {
    const day = d.getDay(); // 0 = Sunday
    const diff = (day === 0 ? -6 : 1) - day; // Monday start
    const res = new Date(d);
    res.setDate(d.getDate() + diff);
    return startOfDay(res);
};

export const endOfWeek = (d) => {
    const start = startOfWeek(d);
    const res = new Date(start);
    res.setDate(start.getDate() + 7);
    return res;
};

export const startOfMonth = (d) =>
    new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d) => 
    new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    
const startOfRange3Months = (d) =>
        new Date(d.getFullYear(), d.getMonth() - 2, 1);

const endOfRange3Months = (d) =>
    new Date(d.getFullYear(), d.getMonth() + 1, 1);

const startOfAllTime = () => new Date(0);

const endOfAllTime = () => new Date();

export const createRange = (type, baseDate = new Date()) => {
    switch (type) {
        case "day":
            return {
                type,
                startDate: startOfDay(baseDate),
                endDate: endOfDay(baseDate),
            };

        case "week":
            return {
                type,
                startDate: startOfWeek(baseDate),
                endDate: endOfWeek(baseDate),
            };

        case "month":
            return {
                type,
                startDate: startOfMonth(baseDate),
                endDate: endOfMonth(baseDate),
            };

        case "range": 
            return {
                type,
                startDate: startOfRange3Months(baseDate),
                endDate: endOfRange3Months(baseDate),
            };
        case "year":
            return {
                type,
                startDate: new Date(
                    baseDate.getFullYear(),
                    baseDate.getMonth() - 11,
                    1
                ),
                endDate: new Date(
                    baseDate.getFullYear(),
                    baseDate.getMonth() + 1,
                    1
                ),
            };

        case "all":
            return {
                type,
                startDate: startOfAllTime(),
                endDate: endOfAllTime(),
            };

        default:
            return createRange("day", baseDate);
    }
};
export const normalizeRange = (state) => {
  const start = new Date(state.startDate);
  const end = new Date(state.endDate);

  // start of day (UTC-safe)
  start.setHours(0, 0, 0, 0);

  // end of day → next day start (exclusive boundary)
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + 1);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};


export const shiftRange = (state, direction) => {
    const factor = direction === "next" ? 1 : -1;

    if (state.type === "all") return state;

    const base = state.startDate || new Date();

    let newDate;

    if (state.type === "day") {
        newDate = new Date(base);
        newDate.setDate(newDate.getDate() + factor);
        return createRange("day", newDate);
    }

    if (state.type === "week") {
        newDate = new Date(base);
        newDate.setDate(newDate.getDate() + factor * 7);
        return createRange("week", newDate);
    }

    if (state.type === "month") {
        newDate = new Date(
            base.getFullYear(),
            base.getMonth() + factor,
            1
        );
        return createRange("month", newDate);
    }

    if (state.type === "range") {
        const length =
            (state.endDate - state.startDate) /
            (1000 * 60 * 60 * 24);

        const newStart = new Date(state.startDate);
        newStart.setDate(
            newStart.getDate() + factor * (length + 1)
        );

        const newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + length);

        return {
            ...state,
            startDate: newStart,
            endDate: newEnd,
        };
    }

    return state;
};

export const formatLabel = (state) => {
    if (!state) return "";

    const start = new Date(state.startDate);
    const end = new Date(state.endDate);
    const now = new Date();

    const sameRange = (a, b) =>
        a.startDate.getTime() === start.getTime() &&
        a.endDate.getTime() === end.getTime();

    const formatShortDate = (date) =>
        date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });

    const formatMonthYear = (date) =>
        date.toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
        });

    // For display only because endDate is exclusive
    const displayEnd = new Date(end);
    displayEnd.setDate(displayEnd.getDate() - 1);

    // -------------------------
    // DAY
    // -------------------------
    if (state.type === "day") {
        if (sameRange(createRange("day", now))) {
            return "Today";
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        if (sameRange(createRange("day", yesterday))) {
            return "Yesterday";
        }

        return start.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    }

    // -------------------------
    // WEEK
    // -------------------------
    if (state.type === "week") {
        if (sameRange(createRange("week", now))) {
            return "This Week";
        }

        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);

        if (sameRange(createRange("week", lastWeek))) {
            return "Last Week";
        }

        return `${formatShortDate(start)} – ${formatShortDate(displayEnd)}`;
    }

    // -------------------------
    // MONTH
    // -------------------------
    if (state.type === "month") {
        if (sameRange(createRange("month", now))) {
            return "This Month";
        }

        const lastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );

        if (sameRange(createRange("month", lastMonth))) {
            return "Last Month";
        }

        return formatMonthYear(start);
    }

    // -------------------------
    // LAST 3 MONTHS
    // -------------------------
    if (state.type === "range") {
        if (sameRange(createRange("range", now))) {
            return "Last 3 Months";
        }

        return `${formatShortDate(start)} – ${formatShortDate(displayEnd)}`;
    }

    // -------------------------
    // LAST 12 MONTHS
    // -------------------------
    if (state.type === "year") {
        if (sameRange(createRange("year", now))) {
            return "Last 12 Months";
        }

        return `${formatMonthYear(start)} – ${formatMonthYear(displayEnd)}`;
    }

    // -------------------------
    // ALL TIME
    // -------------------------
    if (state.type === "all") {
        return "All Time";
    }

    // -------------------------
    // FALLBACK
    // -------------------------
    return `${formatShortDate(start)} – ${formatShortDate(displayEnd)}`;
};