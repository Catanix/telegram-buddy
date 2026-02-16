import { config } from 'dotenv';

config();

/**
 * @typedef {Object} BotConfig
 * @property {string} token - Telegram bot token
 * @property {string} adminUsername - Admin username without @
 * @property {number} adminChatId - Admin Telegram chat ID
 * @property {string} openaiApiKey - OpenAI API key
 * @property {string} dbPath - Path to SQLite database
 * @property {number} messageHistoryLimit - Max messages to store per group
 */

/**
 * Validate and load configuration
 * @returns {BotConfig}
 * @throws {Error} If required env vars are missing
 */
function loadConfig() {
    const required = [
        'TELEGRAM_TOKEN',
        'AUTHORIZED_USERNAME',
        'ADMIN_CHAT_ID'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    const config = {
        token: process.env.TELEGRAM_TOKEN,
        adminUsername: process.env.AUTHORIZED_USERNAME,
        adminChatId: parseInt(process.env.ADMIN_CHAT_ID, 10),
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        dbPath: process.env.DB_PATH || './data/bot.db',
        messageHistoryLimit: parseInt(process.env.MESSAGE_HISTORY_LIMIT, 10) || 100,
        nodeEnv: process.env.NODE_ENV || 'development'
    };

    // Validate types
    if (isNaN(config.adminChatId)) {
        throw new Error('ADMIN_CHAT_ID must be a valid number');
    }

    return config;
}

export const CONFIG = loadConfig();

/**
 * Check if running in development mode
 * @returns {boolean}
 */
export const isDev = () => CONFIG.nodeEnv === 'development';

/**
 * Check if running in production mode  
 * @returns {boolean}
 */
export const isProd = () => CONFIG.nodeEnv === 'production';
