import { logger } from '../utils/logger.js';
import { CONFIG } from '../config/index.js';
import { saveGroupMessage } from '../services/database/messages.js';
import * as groupPermissions from '../services/groupPermissions.js';

/**
 * Initialize all middleware
 * @param {Telegraf} bot 
 */
export function initMiddleware(bot) {
    // Log all updates
    bot.use(logMiddleware);
    
    // Access control and message saving
    bot.use(accessControlMiddleware);
}

/**
 * Log all incoming updates
 */
function logMiddleware(ctx, next) {
    const chatType = ctx.chat?.type || 'unknown';
    const chatId = ctx.chat?.id || 'unknown';
    const username = ctx.from?.username || 'unknown';
    const text = ctx.message?.text || ctx.callbackQuery?.data || '[no text]';
    
    // Force console.log for debugging
    console.log(`[DEBUG] Got message: ${text.substring(0, 30)} from @${username} in ${chatId}`);
    
    return next();
}

/**
 * Access control and message saving middleware
 */
async function accessControlMiddleware(ctx, next) {
    const chatType = ctx.chat?.type;
    const username = ctx.from?.username;
    const chatId = ctx.chat?.id;
    const chatTitle = ctx.chat?.title;

    // Private chats - admin only + auto-download
    if (chatType === 'private') {
        if (username !== CONFIG.adminUsername) {
            logger.warn(`Unauthorized access attempt by @${username}`);
            return ctx.reply('❌ У вас нет доступа к этому боту.');
        }
        // Admin allowed - handle auto-download
        if (ctx.message?.text && !ctx.message.text.startsWith('/')) {
            try {
                const { extractMediaUrls } = await import('../utils/extractUrl.js');
                const { downloadInstagramMedia } = await import('../services/media/instagram.js');
                const { downloadTikTokMedia } = await import('../services/media/tiktok.js');
                const { getVideoInfo } = await import('../services/media/youtube.js');
                const { downloadXMedia, formatXMessage } = await import('../services/media/x.js');
                const media = extractMediaUrls(ctx.message.text);
                if (media?.url) {
                    console.log(`[AUTO DOWNLOAD] ${media.type} for admin`);
                    // Download logic here
                }
            } catch (e) {
                console.error('[AUTO DOWNLOAD ERROR]', e);
            }
        }
        return next();
    }

    // Groups - check permissions and save messages
    if (chatType === 'group' || chatType === 'supergroup') {
        // Save ALL messages first (before checking permission)
        if (ctx.message?.text) {
            try {
                await saveGroupMessage(
                    chatId, 
                    ctx.message.message_id, 
                    ctx.from.id, 
                    username, 
                    ctx.from.first_name, 
                    ctx.message.text
                );
                logger.info(`Saved message from ${chatId}: ${ctx.message.text.substring(0, 30)}`);
            } catch (error) {
                logger.error('Failed to save group message:', error);
            }
        }
        
        // Check if group is allowed
        const isAllowed = await groupPermissions.isGroupAllowed(String(chatId));
        
        if (!isAllowed) {
            logger.info(`New group detected: ${chatTitle} (${chatId})`);
            
            // Save group request
            await groupPermissions.requestGroupAccess(String(chatId), chatTitle, username);
            
            // Notify admin
            try {
                await ctx.telegram.sendMessage(
                    CONFIG.adminChatId,
                    `📢 Новая группа!\n\nНазвание: ${chatTitle}\nID: ${chatId}\nОт: @${username}`,
                    {
                        reply_markup: {
                            inline_keyboard: [[
                                { text: '✅ Разрешить', callback_data: `allow_group_${chatId}` },
                                { text: '❌ Отклонить', callback_data: `deny_group_${chatId}` }
                            ]]
                        }
                    }
                );
            } catch (error) {
                logger.error('Failed to notify admin about new group:', error);
            }
            
            // Reply in group
            try {
                await ctx.reply('👋 Привет! Ожидайте разрешения администратора.');
            } catch (error) {
                logger.error('Failed to reply in new group:', error);
            }
        }
        
        return next();
    }

    return next();
}
