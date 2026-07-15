const dateFormat = (date, time = false) => {
    if (!date) return "N/A";

    const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
    };

    if (time) {
        options.hour = "2-digit";
        options.minute = "2-digit";
        // Optional:
        // options.second = "2-digit";
        // options.hour12 = false; // Use 24-hour format
    }

    return new Date(date).toLocaleString("en-KE", options);
};

export { dateFormat };