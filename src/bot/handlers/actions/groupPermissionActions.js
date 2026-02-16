import { logger } from '../../../utils/logger.js';
import { CONFIG } from '../../../config/index.js';
import * as groupPermissions from '../../../services/groupPermissions.js';

/**
 * Check if user is admin
 * @param {Context} ctx 
 * @returns {boolean}
 */
function isAdmin(ctx) {
    return ctx.from?.username === CONFIG.adminUsername || 
           ctx.from?.id === CONFIG.adminChatId;
}

/**
 * Register group permission action handlers
 * @param {Telegraf} bot 
 */
export function registerGroupPermissionActions(bot) {
    // Allow group action
    bot.action(/allow_group_(.+)/, async (ctx) => {
        if (!isAdmin(ctx)) {
            return ctx.answerCbQuery('❌ Только администратор может разрешать группы');
        }
        
        const groupId = ctx.match[1];
        
        try {
            await groupPermissions.allowGroupAccess(groupId);
            
            // Notify group
            try {
                await ctx.telegram.sendMessage(
                    groupId,
                    '✅ Администратор разрешил использование бота в этой группе!\n\n' +
                    '📋 Доступные команды:\n' +
                    '/unzip - извлечь контент по ссылке\n' +
                    '/summary - саммаризация обсуждения'
                );
            } catch (error) {
                logger.error('Failed to notify group about allowance:', error);
            }
            
            // Update admin message
            await ctx.editMessageText(
                ctx.callbackQuery.message.text + '\n\n✅ ГРУППА РАЗРЕШЕНА',
                { reply_markup: { inline_keyboard: [] } }
            );
            await ctx.answerCbQuery('Группа разрешена');
            
        } catch (error) {
            logger.error('Error allowing group:', error);
            await ctx.answerCbQuery('❌ Ошибка при разрешении группы');
        }
    });
    
    // Deny group action
    bot.action(/deny_group_(.+)/, async (ctx) => {
        if (!isAdmin(ctx)) {
            return ctx.answerCbQuery('❌ Только администратор может отклонять группы');
        }
        
        const groupId = ctx.match[1];
        
        try {
            await groupPermissions.denyGroupAccess(groupId);
            
            // Notify group
            try {
                await ctx.telegram.sendMessage(
                    groupId,
                    '❌ Администратор отклонил запрос на использование бота в этой группе.'
                );
            } catch (error) {
                logger.error('Failed to notify group about denial:', error);
            }
            
            // Update admin message
            await ctx.editMessageText(
                ctx.callbackQuery.message.text + '\n\n❌ ГРУППА ОТКЛОНЕНА',
                { reply_markup: { inline_keyboard: [] } }
            );
            await ctx.answerCbQuery('Группа отклонена');
            
        } catch (error) {
            logger.error('Error denying group:', error);
            await ctx.answerCbQuery('❌ Ошибка при отклонении группы');
        }
    });
}
