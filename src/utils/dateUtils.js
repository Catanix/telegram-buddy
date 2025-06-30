export function isValidDate(input) {
  const date = typeof input === 'string' ? new Date(input) : input;
  return date instanceof Date && !isNaN(date.getTime());
}

export function formatDateForDisplay(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj)) return '';

  return dateObj.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
