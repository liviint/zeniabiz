export const validateEmail = (email) => {
    let errorMessage = "";

    if (!email.trim()) {
        errorMessage = "Please enter your email.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        errorMessage = "Please enter a valid email address.";
    }

    const isValid = errorMessage === "";

    return { isValid, errorMessage };
};

export const htmlToPlainText = (html) => {
    if (!html) return '';

    return html
        // replace <br> and <div> with new lines
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<div>/gi, '')
        // remove any remaining HTML tags
        .replace(/<\/?[^>]+(>|$)/g, '')
        // clean extra newlines
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};
