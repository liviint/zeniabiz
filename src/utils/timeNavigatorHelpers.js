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
    res.setDate(start.getDate() + 6);
    return res;
};

export const startOfMonth = (d) =>
    new Date(d.getFullYear(), d.getMonth(), 1);

export const endOfMonth = (d) =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0);

const startOfRange3Months = (d) =>
        new Date(d.getFullYear(), d.getMonth() - 2, 1);

    const endOfRange3Months = (d) =>
        new Date(d.getFullYear(), d.getMonth() + 1, 1);

    const startOfAllTime = () => new Date(0);

    const endOfAllTime = () => new Date(8640000000000000); 

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

        case "range": // last 3 months
            return {
                type,
                startDate: startOfRange3Months(baseDate),
                endDate: endOfRange3Months(baseDate),
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
    const format = (d) => {
        const date = new Date(d);

        return (
            date.getFullYear() +
            "-" +
            String(date.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(date.getDate()).padStart(2, "0")
        );
    };

    return {
        startDate: format(state.startDate),
        endDate: format(state.endDate),
    };
};


export const shiftRange = (state, direction) => {
    const factor = direction === "next" ? 1 : -1;

    if (state.type === "all") return state;

    // prevent moving into future
    const today = new Date();

    const base =
        state.startDate || new Date();

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
    if (state.type === "all") return "All Time";

    const opts = { month: "short", day: "numeric" };

    if (state.type === "day") {
        return state.startDate.toLocaleDateString(undefined, {
            weekday: "short",
            ...opts,
        });
    }

    if (state.type === "month") {
        return state.startDate.toLocaleString(undefined, {
            month: "long",
            year: "numeric",
        });
    }

    return `${state.startDate.toLocaleDateString(
        undefined,
        opts
    )} – ${state.endDate.toLocaleDateString(undefined, opts)}`;
};