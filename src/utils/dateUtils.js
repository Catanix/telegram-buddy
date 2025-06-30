// Map of Russian month names to their numeric values (1-12)
const russianMonthMap = {
  'января': 1, 'янв': 1, 'январь': 1,
  'февраля': 2, 'фев': 2, 'февраль': 2,
  'марта': 3, 'мар': 3, 'март': 3,
  'апреля': 4, 'апр': 4, 'апрель': 4,
  'мая': 5, 'май': 5,
  'июня': 6, 'июн': 6, 'июнь': 6,
  'июля': 7, 'июл': 7, 'июль': 7,
  'августа': 8, 'авг': 8, 'август': 8,
  'сентября': 9, 'сен': 9, 'сентябрь': 9,
  'октября': 10, 'окт': 10, 'октябрь': 10,
  'ноября': 11, 'ноя': 11, 'ноябрь': 11,
  'декабря': 12, 'дек': 12, 'декабрь': 12
};

/**
 * Parse a date string in various formats and return a Date object
 */
function parseDate(dateString) {
  try {
    if (!dateString) return null;

    // Clean up the input string
    let cleanDateString = dateString.trim()
      .replace(/^Дата:\s*/, '')
      .replace(/^"(.+)"$/, '$1')
      .replace(/\.$/, '');

    // Check for explicit UTC format like "30.06.2025 13:48:10 UTC"
    const utcFormatMatch = cleanDateString.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})\s+(\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?\s+UTC$/i);
    if (utcFormatMatch) {
      const [, day, month, year, hours, minutes, seconds] = utcFormatMatch;

      // Create a date object directly in UTC
      const utcDate = new Date(Date.UTC(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hours, 10),
        parseInt(minutes, 10),
        parseInt(seconds || '0', 10)
      ));

      return utcDate;
    }

    // Check for ISO format with Z suffix (e.g., "2025-06-30T13:48:10Z")
    if (cleanDateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/i)) {
      try {
        const utcDate = new Date(cleanDateString);
        if (!isNaN(utcDate.getTime())) {
          return utcDate;
        }
      } catch (e) {
        console.error(`[dateUtils] Ошибка при парсинге ISO даты с UTC: ${e.message}`);
      }
    }

    // Check for any date string that ends with UTC
    if (cleanDateString.trim().toUpperCase().endsWith('UTC')) {
      // Remove the UTC suffix and try to parse with Date constructor
      const dateWithoutUTC = cleanDateString.replace(/\s+UTC$/i, '');

      try {
        // First try with Z suffix (ISO format)
        let utcDate = new Date(dateWithoutUTC + 'Z');

        if (isNaN(utcDate.getTime())) {
          // If that fails, try parsing it as is and assume it's already in UTC
          utcDate = new Date(dateWithoutUTC);
        }

        if (!isNaN(utcDate.getTime())) {
          return utcDate;
        }
      } catch (e) {
        console.error(`[dateUtils] Ошибка при парсинге даты с UTC: ${e.message}`);
      }
    }

    // Check for relative time expressions like "через X секунд/минут/часов"
    const relativeTimeMatch = cleanDateString.match(/через\s+(\d+)\s+(секунд|секунды|секунду|минут|минуты|минуту|часов|часа|час)/i);
    if (relativeTimeMatch) {
      const [, amount, unit] = relativeTimeMatch;
      const now = new Date();
      const amountNum = parseInt(amount, 10);

      // Create a new date by adding the specified amount of time
      if (unit.toLowerCase().startsWith('секунд') || unit.toLowerCase() === 'секунду') {
        // Create a new UTC date by adding seconds to the current UTC time
        return new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds() + amountNum,
          now.getUTCMilliseconds()
        ));
      } else if (unit.toLowerCase().startsWith('минут') || unit.toLowerCase() === 'минуту') {
        // Create a new UTC date by adding minutes to the current UTC time
        return new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes() + amountNum,
          now.getUTCSeconds(),
          now.getUTCMilliseconds()
        ));
      } else if (unit.toLowerCase().startsWith('час') || unit.toLowerCase() === 'час') {
        // Create a new UTC date by adding hours to the current UTC time
        return new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours() + amountNum,
          now.getUTCMinutes(),
          now.getUTCSeconds(),
          now.getUTCMilliseconds()
        ));
      }
    }

    // Check for Russian date format with month name (e.g., "4 июля" or "4 июля 2025")
    const russianDateMatch = cleanDateString.match(/(\d{1,2})\s+([а-яА-Я]+)(?:\s+(\d{4}))?(?:\s+в\s+(\d{1,2})[:\.](\d{1,2}))?/);
    if (russianDateMatch) {
      const [, day, monthName, yearStr, hours, minutes] = russianDateMatch;
      const monthNumber = russianMonthMap[monthName.toLowerCase()];

      if (monthNumber) {
        // If year is not specified, use the next occurrence of this date
        const currentDate = new Date();
        const year = yearStr ? parseInt(yearStr, 10) : currentDate.getFullYear();

        // Create a date object with the parsed values in local time
        const localDate = new Date(
          year,
          monthNumber - 1,
          parseInt(day, 10),
          parseInt(hours || '0', 10),
          parseInt(minutes || '0', 10),
          0
        );

        // Convert to UTC
        const date = new Date(Date.UTC(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          localDate.getHours(),
          localDate.getMinutes(),
          localDate.getSeconds()
        ));

        // If the date is in the past and no year was specified, use next year
        if (!yearStr && date < currentDate) {
          date.setUTCFullYear(date.getUTCFullYear() + 1);
        }

        return date;
      }
    }

    // Check for DD.MM.YYYY format
    const ddmmyyyyMatch = cleanDateString.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})(?:\s+(\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?)?$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year, hours, minutes, seconds] = ddmmyyyyMatch;

      // Create a date object with the parsed values in local time
      const localDate = new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        parseInt(hours || '0', 10),
        parseInt(minutes || '0', 10),
        parseInt(seconds || '0', 10)
      );

      // Convert to UTC
      return new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        localDate.getHours(),
        localDate.getMinutes(),
        localDate.getSeconds()
      ));
    }

    // Try to parse the date using Date constructor
    let date = new Date(cleanDateString);

    // If that fails, try to handle common Russian date formats
    if (isNaN(date.getTime())) {
      // Check for DD.MM.YYYY HH:MM[:SS] format
      const ddmmyyyyTimeMatch = cleanDateString.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})(?:\s+(\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?)?/);
      if (ddmmyyyyTimeMatch) {
        const [, day, month, year, hours, minutes, seconds] = ddmmyyyyTimeMatch;

        // Create a date object with the parsed values in local time
        const localDate = new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1,
          parseInt(day, 10),
          parseInt(hours || '0', 10),
          parseInt(minutes || '0', 10),
          parseInt(seconds || '0', 10)
        );

        // Convert to UTC
        date = new Date(Date.UTC(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          localDate.getHours(),
          localDate.getMinutes(),
          localDate.getSeconds()
        ));
      } else {
        // Try to handle "today" and "tomorrow" references
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

        if (cleanDateString.toLowerCase().includes('сегодня')) {
          date = today;
        } else if (cleanDateString.toLowerCase().includes('завтра')) {
          const tomorrow = new Date(today);
          tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
          date = tomorrow;
        }

        // Extract time if present
        const timeMatch = cleanDateString.match(/(\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?/);
        if (timeMatch) {
          if (!isNaN(date.getTime())) {
            const [, hours, minutes, seconds] = timeMatch;

            // Set the UTC hours directly
            date.setUTCHours(
              parseInt(hours, 10),
              parseInt(minutes, 10),
              seconds ? parseInt(seconds, 10) : 0,
              0
            );
          } else {
            // Handle time-only format (e.g., "13:00" or "в 16:31")
            // Interpret as local time and convert to UTC
            const [, hours, minutes, seconds] = timeMatch;
            const now = new Date();

            // Create a date object with the current date and the specified local time
            const localDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              parseInt(hours, 10),
              parseInt(minutes, 10),
              seconds ? parseInt(seconds, 10) : 0,
              0
            );

            // Convert to UTC
            date = new Date(Date.UTC(
              localDate.getFullYear(),
              localDate.getMonth(),
              localDate.getDate(),
              localDate.getHours(),
              localDate.getMinutes(),
              localDate.getSeconds(),
              0
            ));
          }
        }
      }
    } else {
      // Check if the original string indicates it's already in UTC
      const isAlreadyUTC = cleanDateString.toUpperCase().includes('UTC') ||
                           cleanDateString.endsWith('Z') ||
                           cleanDateString.includes('GMT+0000') ||
                           cleanDateString.includes('GMT+00:00');

      if (!isAlreadyUTC) {
        // If not UTC, treat it as local time and convert to UTC
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        // Create a UTC date from the local date components
        date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
      }
    }

    // Check if we successfully parsed the date
    if (isNaN(date.getTime())) {
      console.error(`Failed to parse date string: ${dateString}`);
      return null;
    }

    return date;
  } catch (error) {
    console.error(`Error parsing date string: ${dateString}`, error);
    return null;
  }
}

/**
 * Convert a human-readable date string to ISO format
 */
export function convertToISODate(dateString) {
  const date = parseDate(dateString);
  return date ? date.toISOString() : null;
}

/**
 * Format a date for display using locale string
 */
export function formatDateForDisplay(date) {
  if (!date) return '';

  // Parse the date to ensure we have a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error(`Invalid date: ${date}`);
    return '';
  }

  // Use toLocaleString with Russian locale and options for formatting
  return dateObj.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
