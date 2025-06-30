import { config } from 'dotenv';

config();

export function isValidDate(input) {
  const date = typeof input === 'string' ? new Date(input) : input;
  return date instanceof Date && !isNaN(date.getTime());
}

export function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    timeZone: process.env.TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
