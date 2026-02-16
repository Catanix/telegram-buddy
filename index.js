import 'dotenv/config';
import { createBot, startBot } from './src/bot/bot.js';
import { initDatabase } from './src/services/database/index.js';
import { logger } from './src/utils/logger.js';

async function main() {
    try {
        // Initialize database
        await initDatabase();
        logger.info('Database initialized');
        
        // Create and start bot
        const bot = createBot();
        await startBot(bot);
    } catch (error) {
        logger.error('Fatal error:', error);
        process.exit(1);
    }
}

main();
