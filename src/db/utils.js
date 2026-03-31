export function getMonthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1); 

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}