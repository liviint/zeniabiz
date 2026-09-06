export function formatMoney(value) {
    return Number(
        value || 0
    ).toLocaleString("en-KE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function formatFilter(filter) {
    switch (filter) {
        case "with_balance":
            return "With Balance";

        case "no_balance":
            return "No Balance";

        default:
            return "All";
    }
}

export function formatDate(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-KE",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}


export function formatSort(sort) {
    switch (sort) {
        case "name_asc":
            return "Name A–Z";

        case "name_desc":
            return "Name Z–A";

        case "newest":
            return "Newest";

        case "oldest":
            return "Oldest";

        case "high_revenue":
            return "Highest Revenue";

        case "high_paid":
            return "Highest Paid";

        case "high_balance":
            return "Highest Balance";

        default:
            return sort || "Default";
    }
}

export function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function formatTimeState(timeState) {

    if (!timeState) {
        return "All Time";
    }


    if (
        timeState.type === "all"
    ) {
        return "All Time";
    }


    if (
        timeState.startDate &&
        timeState.endDate
    ) {

        const start =
            new Date(
                timeState.startDate
            );

        const end =
            new Date(
                timeState.endDate
            );


        return `${start.toLocaleDateString(
            "en-KE",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        )} – ${end.toLocaleDateString(
            "en-KE",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        )}`;
    }


    return (
        timeState.type ||
        "Current Period"
    );
}