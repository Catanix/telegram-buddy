/**
 * Utility functions for parsing and formatting dates
 */

/**
 * Convert a human-readable date string to ISO format
 *
 * This function attempts to parse a date string using standard JavaScript Date parsing.
 * It handles various formats including:
 * - DD.MM.YYYY HH:MM
 * - DD.MM.YYYY
 * - DD/MM/YYYY
 * - ISO format
 * - Natural language dates from DeepSeek API
 *
 * @param {string} dateString - The date string to convert
 * @param {boolean} [isLocalTime=false] - Whether the input is in the local time zone
 * @returns {string|null} - The ISO date string or null if conversion failed
 */
export function convertToISODate(dateString, isLocalTime = false) {
  try {
    if (!dateString) return null;

    // Clean up the input string - remove any "Дата: " prefix and handle nested quotes
    let cleanDateString = dateString.trim()
      .replace(/^Дата:\s*/, '')
      .replace(/^"(.+)"$/, '$1')
      .replace(/\.$/, '');

    // Get the local time zone offset in hours
    const localTimeZoneOffset = -new Date().getTimezoneOffset() / 60;

    // Try to parse the date using Date.parse
    let date = new Date(cleanDateString);

    // If that fails, try to handle common Russian date formats
    if (isNaN(date.getTime())) {
      // Check for DD.MM.YYYY HH:MM[:SS] format
      const ddmmyyyyTimeMatch = cleanDateString.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})(?:\s+(\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?)?/);
      if (ddmmyyyyTimeMatch) {
        const [, day, month, year, hours, minutes, seconds] = ddmmyyyyTimeMatch;
        // Note: month is 0-indexed in JavaScript Date

        if (isLocalTime) {
          // If the input is in the local time zone, adjust the hours by subtracting the time zone offset
          const utcHours = (parseInt(hours || '0', 10) - localTimeZoneOffset + 24) % 24;

          // Create a UTC date by using Date.UTC
          date = new Date(Date.UTC(
            parseInt(year, 10),
            parseInt(month, 10) - 1,
            parseInt(day, 10),
            utcHours,
            parseInt(minutes || '0', 10),
            parseInt(seconds || '0', 10)
          ));
        } else {
          // If the input is in UTC, create a UTC date directly
          date = new Date(Date.UTC(
            parseInt(year, 10),
            parseInt(month, 10) - 1,
            parseInt(day, 10),
            parseInt(hours || '0', 10),
            parseInt(minutes || '0', 10),
            parseInt(seconds || '0', 10)
          ));
        }
      } else {
        // Handle natural language dates from DeepSeek API
        // Extract day, month, year, and time components
        const dateTimeMatch = cleanDateString.match(/(\d{1,2})[\s\.\/](\d{1,2})[\s\.\/](\d{4})(?:[,\s]+(\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?)?/);

        if (dateTimeMatch) {
          const [, day, month, year, hours, minutes, seconds] = dateTimeMatch;

          if (isLocalTime) {
            // If the input is in the local time zone, adjust the hours by subtracting the time zone offset
            const utcHours = (parseInt(hours || '0', 10) - localTimeZoneOffset + 24) % 24;

            // Create a UTC date by using Date.UTC
            date = new Date(Date.UTC(
              parseInt(year, 10),
              parseInt(month, 10) - 1,
              parseInt(day, 10),
              utcHours,
              parseInt(minutes || '0', 10),
              parseInt(seconds || '0', 10)
            ));
          } else {
            // If the input is in UTC, create a UTC date directly
            date = new Date(Date.UTC(
              parseInt(year, 10),
              parseInt(month, 10) - 1,
              parseInt(day, 10),
              parseInt(hours || '0', 10),
              parseInt(minutes || '0', 10),
              parseInt(seconds || '0', 10)
            ));
          }
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
          if (timeMatch && !isNaN(date.getTime())) {
            const [, hours, minutes, seconds] = timeMatch;

            if (isLocalTime) {
              // If the input is in the local time zone, adjust the hours by subtracting the time zone offset
              const utcHours = (parseInt(hours, 10) - localTimeZoneOffset + 24) % 24;

              date.setUTCHours(
                utcHours,
                parseInt(minutes, 10),
                seconds ? parseInt(seconds, 10) : 0,
                0
              );
            } else {
              // If the input is in UTC, set the UTC hours directly
              date.setUTCHours(
                parseInt(hours, 10),
                parseInt(minutes, 10),
                seconds ? parseInt(seconds, 10) : 0,
                0
              );
            }
          }
        }
      }
    } else {
      // If the date was successfully parsed using Date.parse,
      // we need to ensure it's treated correctly based on isLocalTime
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();

      if (isLocalTime) {
        // If the input is in the local time zone, adjust the hours by subtracting the time zone offset
        const utcHours = (hours - localTimeZoneOffset + 24) % 24;

        // Create a UTC date by using Date.UTC
        date = new Date(Date.UTC(year, month, day, utcHours, minutes, seconds));
      } else {
        // If the input is in UTC, create a UTC date directly
        date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
      }
    }

    // Check if we successfully parsed the date
    if (isNaN(date.getTime())) {
      console.error(`Failed to parse date string: ${dateString}`);
      return null;
    }

    return date.toISOString();
  } catch (error) {
    console.error(`Error parsing date string: ${dateString}`, error);
    return null;
  }
}

/**
 * Format a date in CIS region format (DD.MM.YYYY HH:MM)
 *
 * @param {string|Date} date - The date to format (ISO string or Date object)
 * @returns {string} - The formatted date string
 */
export function formatDateForCIS(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    console.error(`Invalid date: ${date}`);
    return '';
  }

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
