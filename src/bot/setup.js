import { logger } from '../utils/logger.js';
import { statsHandler } from './handlers/commands/statsHandler.js';
import { musicSearchHandler } from './handlers/commands/musicSearchHandler.js';
import { unzipHandler, summaryHandler } from './handlers/commands/groupCommands.js';
import { initGroupHandlers } from './handlers/actions/init.js';
import { textHandler } from './handlers/textHandler.js';

/**
 * Initialize all bot commands
 * @param {Telegraf} bot 
 */
export function initCommands(bot) {
    // Stats command
    bot.command(['stats', 'stats@catanix_home_bot'], statsHandler);
    
    // Music search
    bot.command(['music', 'music@catanix_home_bot'], musicSearchHandler);
    
    // Group commands
    bot.command(['unzip', 'unzip@catanix_home_bot'], unzipHandler);
    bot.command(['summary', 'summary@catanix_home_bot'], summaryHandler);
    
    logger.info('Commands initialized');
}

/**
 * Initialize all handlers
 * @param {Telegraf} bot 
 */
export function initHandlers(bot) {
    // Initialize group-related handlers (my_chat_member, etc.)
    initGroupHandlers(bot);
    
    // NOTE: textHandler removed - auto-download logic moved to middleware
    
    logger.info('Handlers initialized');
}
