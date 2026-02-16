import { logger } from '../../utils/logger.js';
import { statsHandler } from './commands/statsHandler.js';
import { musicSearchHandler } from './commands/musicSearchHandler.js';
import { unzipHandler, summaryHandler } from './commands/groupCommands.js';
import { initGroupHandlers } from './actions/init.js';
import { textHandler } from './textHandler.js';

/**
 * Initialize all bot handlers
 * @param {Telegraf} bot 
 */
export function initBotHandlers(bot) {
    // Stats command
    bot.command(['stats', 'stats@catanix_home_bot'], statsHandler);
    
    // Music search
    bot.command(['music', 'music@catanix_home_bot'], musicSearchHandler);
    
    // Group commands
    bot.command(['unzip', 'unzip@catanix_home_bot'], unzipHandler);
    bot.command(['summary', 'summary@catanix_home_bot'], summaryHandler);
    
    // Text handler for auto-downloads (private chats only)
    bot.on('text', textHandler);
    
    // Initialize group-related handlers (my_chat_member, etc.)
    initGroupHandlers(bot);
    
    logger.info('All handlers initialized');
}
