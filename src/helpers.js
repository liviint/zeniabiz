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

const hexToRgb = (hex) => {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

export const chartConfig = (primaryColor, colors) => {
  const { r, g, b } = hexToRgb(primaryColor);

  return {
    backgroundGradientFrom: colors.background || "#FAF9F7",
    backgroundGradientTo: colors.background || "#FAF9F7",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${r}, ${g}, ${b}, ${opacity})`,
    labelColor: () => colors.text || "#333",
  };
};
