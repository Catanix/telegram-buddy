import { registerMusicActions } from "../commands/musicSearchHandler.js";
import { textHandler } from "../textHandler.js";
import { registerYoutubeDownloadAction } from "./youtubeDownloadAction.js";
import { registerGroupPermissionActions } from "./groupPermissionActions.js";
import { saveGroupMessage } from '../../../services/db.js';
import { isGroupAllowed, requestGroupAccess } from '../../../models/GroupPermissionsModel.js';

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const ADMIN_USERNAME = process.env.AUTHORIZED_USERNAME;

export const initBotHandlersActions = (bot) => {
    // Обработка добавления бота в группу
    bot.on('new_chat_members', async (ctx) => {
        const newMembers = ctx.message.new_chat_members;
        const botInfo = await ctx.telegram.getMe();
        
        // Проверяем, добавлен ли именно наш бот
        const botAdded = newMembers.some(member => member.id === botInfo.id);
        
        if (botAdded) {
            const chatId = ctx.chat.id;
            const chatTitle = ctx.chat.title || 'Группа';
            const addedBy = ctx.from?.username || ctx.from?.first_name || 'unknown';
            
            console.log(`[BOT ADDED TO GROUP] ${chatTitle} (${chatId}) by @${addedBy}`);
            
            // Проверяем, разрешена ли группа
            const isAllowed = await isGroupAllowed(String(chatId));
            
            if (!isAllowed) {
                // Запрашиваем доступ
                await requestGroupAccess(String(chatId), chatTitle, addedBy);
                
                // Отправляем запрос админу
                if (ADMIN_CHAT_ID) {
                    try {
                        await ctx.telegram.sendMessage(
                            ADMIN_CHAT_ID,
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
                        console.log(`[NOTIFICATION SENT] Admin notified about group ${chatTitle}`);
                    } catch (e) {
                        console.error('[NOTIFICATION ERROR] Failed to notify admin:', e);
                    }
                }
                
                // Отвечаем в группу
                await ctx.reply(
                    `👋 Привет! Я бот для извлечения контента из социальных сетей.\n\n` +
                    `⏳ Ожидайте разрешения администратора @${ADMIN_USERNAME} на использование в этой группе.`
                );
            } else {
                // Группа уже разрешена
                await ctx.reply(
                    `👋 Привет! Я снова здесь.\n\n` +
                    `📋 Доступные команды:\n` +
                    `/unzip - извлечь контент по ссылке\n` +
                    `/summary - саммаризация обсуждения`
                );
            }
        }
    });

    // Обработка текстовых сообщений
    bot.on('text', async (ctx, next) => {
        // Сохраняем сообщения из групп для саммаризации
        if (ctx.chat.type !== 'private' && ctx.message.text) {
            await saveGroupMessage(
                ctx.chat.id,
                ctx.message.message_id,
                ctx.from.id,
                ctx.from.username,
                ctx.from.first_name,
                ctx.message.text
            );
        }
        return textHandler(ctx, next);
    });
    
    // Регистрация действий
    registerMusicActions(bot);
    registerYoutubeDownloadAction(bot);
    registerGroupPermissionActions(bot); // Для управления доступом к группам
};
