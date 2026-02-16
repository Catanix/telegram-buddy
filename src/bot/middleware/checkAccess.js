import { isGroupAllowed, requestGroupAccess, getGroupInfo } from '../../models/GroupPermissionsModel.js';

const ADMIN_USERNAME = process.env.AUTHORIZED_USERNAME;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // Для отправки запросов на разрешение

/**
 * Middleware для проверки доступа
 * - В личных чатах: только ADMIN_USERNAME
 * - В группах: только если группа разрешена
 */
export const checkAccess = (bot) => {
    bot.use(async (ctx, next) => {
        const chatType = ctx.chat?.type;
        const username = ctx.from?.username;
        const chatId = ctx.chat?.id;
        const chatTitle = ctx.chat?.title || 'Личный чат';

        // Личный чат - только админ
        if (chatType === 'private') {
            if (username !== ADMIN_USERNAME) {
                console.warn(`[ACCESS DENIED] @${username} tried to use private chat`);
                return ctx.reply('❌ У вас нет доступа к этому боту.');
            }
            return next();
        }

        // Группа или канал
        if (chatType === 'group' || chatType === 'supergroup' || chatType === 'channel') {
            const isAllowed = await isGroupAllowed(String(chatId));
            
            if (!isAllowed) {
                const groupInfo = await getGroupInfo(String(chatId));
                
                // Если ещё не отправляли запрос - отправляем
                if (!groupInfo) {
                    await requestGroupAccess(String(chatId), chatTitle, username);
                    
                    // Отправляем запрос админу
                    if (ADMIN_CHAT_ID) {
                        await ctx.telegram.sendMessage(
                            ADMIN_CHAT_ID,
                            `📢 Бота добавили в новую группу!\n\n` +
                            `Название: ${chatTitle}\n` +
                            `ID: ${chatId}\n` +
                            `Добавил: @${username || 'unknown'}`,
                            {
                                reply_markup: {
                                    inline_keyboard: [[
                                        { text: '✅ Разрешить', callback_data: `allow_group_${chatId}` },
                                        { text: '❌ Отклонить', callback_data: `deny_group_${chatId}` }
                                    ]]
                                }
                            }
                        );
                    }
                    
                    await ctx.reply(
                        `👋 Привет! Я бот для извлечения контента из социальных сетей.\n\n` +
                        `⏳ Ожидайте разрешения администратора на использование в этой группе.`
                    );
                }
                
                return;
            }
            
            return next();
        }

        return next();
    });
};

/**
 * Проверяет, является ли пользователь админом
 */
export const isAdmin = (ctx) => {
    return ctx.from?.username === ADMIN_USERNAME;
};

/**
 * Получить ID админа для отправки уведомлений
 */
export const getAdminChatId = () => ADMIN_CHAT_ID;
