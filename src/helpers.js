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

export const groupDataIntoSections = (allData) => {
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const startOfWeek = new Date(startOfToday);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sections = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  allData.forEach((data) => {
    const d = new Date(data.date);

    if (d >= startOfToday) {
      sections.today.push(data);
    } else if (d >= startOfYesterday) {
      sections.yesterday.push(data);
    } else if (d >= startOfWeek) {
      sections.thisWeek.push(data);
    } else if (d >= startOfMonth) {
      sections.thisMonth.push(data);
    } else {
      sections.older.push(data);
    }
  });

  return sections;
};
