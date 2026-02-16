import { Telegraf } from 'telegraf';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { setActualCommandList } from '../utils/commandList.js';
import { initMiddleware } from './middleware.js';
import { initCommands, initHandlers } from './setup.js';

/**
 * Initialize and configure the bot
 * @returns {Telegraf} Configured bot instance
 */
export function createBot() {
    const bot = new Telegraf(CONFIG.token);

    // Error handling middleware (first)
    bot.catch((err, ctx) => {
        logger.error(`Bot error for update ${ctx.update?.update_id}:`, err);
        
        // Don't crash on errors
        try {
            ctx.reply('Произошла ошибка. Попробуйте позже.');
        } catch {
            // Ignore reply errors
        }
    });

    // MIDDLEWARE FIRST - before commands!
    initMiddleware(bot);
    
    // Set up commands and handlers
    setActualCommandList(bot);
    initCommands(bot);
    initHandlers(bot);

    return bot;
}

/**
 * Start the bot
 * @param {Telegraf} bot - Bot instance
 */
export async function startBot(bot) {
    try {
        // Get bot info
        const me = await bot.telegram.getMe();
        logger.info(`Bot @${me.username} (ID: ${me.id}) starting...`);

        // Start polling
        await bot.launch();
        logger.info('Bot is running (polling mode)');

        // Graceful shutdown
        process.once('SIGINT', () => {
            logger.info('Received SIGINT, stopping...');
            bot.stop('SIGINT');
        });
        process.once('SIGTERM', () => {
            logger.info('Received SIGTERM, stopping...');
            bot.stop('SIGTERM');
        });
    } catch (error) {
        logger.error('Failed to start bot:', error);
        throw error;
    }
}
