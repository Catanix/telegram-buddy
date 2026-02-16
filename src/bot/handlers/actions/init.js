import { logger } from '../../../utils/logger.js';
import { CONFIG } from '../../../config/index.js';
import * as groupPermissions from '../../../services/groupPermissions.js';
import { registerMusicActions } from '../commands/musicSearchHandler.js';
import { registerYoutubeDownloadAction } from './youtubeDownloadAction.js';
import { registerGroupPermissionActions } from './groupPermissionActions.js';

/**
 * Initialize group-related handlers
 * @param {Telegraf} bot 
 */
export function initGroupHandlers(bot) {
    // Bot added to group via my_chat_member
    bot.on('my_chat_member', async (ctx) => {
        const oldStatus = ctx.myChatMember?.old_chat_member?.status;
        const newStatus = ctx.myChatMember?.new_chat_member?.status;
        
        // Bot was added to group
        if ((oldStatus === 'left' || oldStatus === 'kicked') && 
            (newStatus === 'member' || newStatus === 'administrator')) {
            
            const chatId = ctx.chat.id;
            const chatTitle = ctx.chat.title || 'Группа';
            const addedBy = ctx.from?.username || ctx.from?.first_name || 'unknown';
            
            logger.info(`Bot added to group: ${chatTitle} (${chatId}) by @${addedBy}`);
            await handleBotAdded(bot, chatId, chatTitle, addedBy, ctx);
        }
    });
    
    // Fallback: new_chat_members
    bot.on('new_chat_members', async (ctx) => {
        const newMembers = ctx.message.new_chat_members;
        const botInfo = await ctx.telegram.getMe();
        
        const botAdded = newMembers.some(member => member.id === botInfo.id);
        
        if (botAdded) {
            const chatId = ctx.chat.id;
            const chatTitle = ctx.chat.title || 'Группа';
            const addedBy = ctx.from?.username || ctx.from?.first_name || 'unknown';
            
            logger.info(`Bot added via new_chat_members: ${chatTitle} (${chatId})`);
            await handleBotAdded(bot, chatId, chatTitle, addedBy, ctx);
        }
    });
    
    // Register other actions
    registerMusicActions(bot);
    registerYoutubeDownloadAction(bot);
    registerGroupPermissionActions(bot);
}

/**
 * Handle bot being added to a group
 */
async function handleBotAdded(bot, chatId, chatTitle, addedBy, ctx) {
    const isAllowed = await groupPermissions.isGroupAllowed(String(chatId));
    
    if (!isAllowed) {
        // Request access
        await groupPermissions.requestGroupAccess(String(chatId), chatTitle, addedBy);
        
        // Notify admin
        try {
            await bot.telegram.sendMessage(
                CONFIG.adminChatId,
                `📢 Бота добавили в новую группу!\n\n` +
                `Название: ${chatTitle}\n` +
                `ID: ${chatId}\n` +
                `Добавил: @${addedBy}`,
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
            logger.error('Failed to notify admin:', error);
        }
        
        // Reply in group
        try {
            await ctx.reply(
                `👋 Привет! Я бот для извлечения контента из социальных сетей.\n\n` +
                `⏳ Ожидайте разрешения администратора @${CONFIG.adminUsername} на использование в этой группе.`
            );
        } catch (error) {
            logger.error('Failed to reply in group:', error);
        }
    } else {
        // Group already allowed
        try {
            await ctx.reply(
                `👋 Привет! Я снова здесь.\n\n` +
                `📋 Доступные команды:\n` +
                `/unzip - извлечь контент по ссылке\n` +
                `/summary - саммаризация обсуждения`
            );
        } catch (error) {
            logger.error('Failed to reply in group:', error);
        }
    }
}
