import { allowGroupAccess, denyGroupAccess } from '../../models/GroupPermissionsModel.js';
import { isAdmin, getAdminChatId } from '../middleware/checkAccess.js';

/**
 * Регистрация обработчиков для управления доступом к группам
 */
export function registerGroupPermissionActions(bot) {
    // Обработка нажатия "Разрешить" группу
    bot.action(/allow_group_(.+)/, async (ctx) => {
        // Проверяем, что нажал админ
        if (!isAdmin(ctx)) {
            return ctx.answerCbQuery('❌ Только администратор может разрешать группы');
        }
        
        const groupId = ctx.match[1];
        
        try {
            await allowGroupAccess(groupId);
            
            // Отправляем сообщение в группу о разрешении
            try {
                await ctx.telegram.sendMessage(
                    groupId,
                    '✅ Администратор разрешил использование бота в этой группе!\n\n' +
                    '📋 Доступные команды:\n' +
                    '/unzip - извлечь контент по ссылке (ответьте на сообщение или используйте после ссылки)\n' +
                    '/summary - создать саммаризацию последних сообщений'
                );
            } catch (e) {
                console.error('[GroupPermission] Failed to notify group:', e);
            }
            
            // Обновляем сообщение админу
            await ctx.editMessageText(
                ctx.callbackQuery.message.text + '\n\n✅ ГРУППА РАЗРЕШЕНА'
            );
            await ctx.answerCbQuery('Группа разрешена');
            
        } catch (error) {
            console.error('[GroupPermission] Error allowing group:', error);
            await ctx.answerCbQuery('❌ Ошибка при разрешении группы');
        }
    });
    
    // Обработка нажатия "Отклонить" группу
    bot.action(/deny_group_(.+)/, async (ctx) => {
        // Проверяем, что нажал админ
        if (!isAdmin(ctx)) {
            return ctx.answerCbQuery('❌ Только администратор может отклонять группы');
        }
        
        const groupId = ctx.match[1];
        
        try {
            await denyGroupAccess(groupId);
            
            // Отправляем сообщение в группу об отказе
            try {
                await ctx.telegram.sendMessage(
                    groupId,
                    '❌ Администратор отклонил запрос на использование бота в этой группе.'
                );
            } catch (e) {
                console.error('[GroupPermission] Failed to notify group:', e);
            }
            
            // Обновляем сообщение админу
            await ctx.editMessageText(
                ctx.callbackQuery.message.text + '\n\n❌ ГРУППА ОТКЛОНЕНА'
            );
            await ctx.answerCbQuery('Группа отклонена');
            
        } catch (error) {
            console.error('[GroupPermission] Error denying group:', error);
            await ctx.answerCbQuery('❌ Ошибка при отклонении группы');
        }
    });
}
