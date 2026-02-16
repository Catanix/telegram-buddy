/**
 * Simple logger implementation
 * Can be replaced with pino/winston for production
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const CURRENT_LEVEL = process.env.LOG_LEVEL === 'debug' ? LOG_LEVELS.DEBUG : 
                      process.env.LOG_LEVEL === 'warn' ? LOG_LEVELS.WARN :
                      process.env.LOG_LEVEL === 'error' ? LOG_LEVELS.ERROR :
                      LOG_LEVELS.INFO;

/**
 * Format log message with timestamp
 * @param {string} level - Log level
 * @param {string} message - Message to log
 * @returns {string}
 */
function format(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
}

export const logger = {
    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Error|unknown} [error] - Error object
     */
    error: (message, error) => {
        if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
            console.error(format('ERROR', message));
            if (error) {
                console.error(error);
            }
        }
    },

    /**
     * Log warning message
     * @param {string} message - Warning message
     */
    warn: (message) => {
        if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
            console.warn(format('WARN', message));
        }
    },

    /**
     * Log info message
     * @param {string} message - Info message
     */
    info: (message) => {
        if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
            console.info(format('INFO', message));
        }
    },

    /**
     * Log debug message (only in development)
     * @param {string} message - Debug message
     */
    debug: (message) => {
        if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
            console.log(format('DEBUG', message));
        }
    }
};
