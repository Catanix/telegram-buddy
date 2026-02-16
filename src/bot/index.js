import { Telegraf } from 'telegraf';
import { config } from 'dotenv';
import { setActualCommandList } from "../utils/commandList.js";
import { checkAccess } from "./middleware/checkAccess.js";
import { initBotHandlersActions, initBotCommandHandlers } from "./handlers/index.js";
import { initCommandsHandlersActions } from "./handlers/commands/index.js";

config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Установка актуального листа команд
setActualCommandList(bot);

// Регистрация обработчика ошибок
initCommandsHandlersActions(bot);

// Установка обработки всех актуальных команд (ДО middleware!)
initBotCommandHandlers(bot);

// Middleware: проверка доступа (личный чат - только админ, группы - только разрешённые)
// Должен быть ПОСЛЕ регистрации команд, иначе блокирует все
//checkAccess(bot);

// Установка обработки всех актуальных действий
initBotHandlersActions(bot, bot);

// Middleware доступа в конце
const ADMIN_USERNAME = process.env.AUTHORIZED_USERNAME;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

bot.use(async (ctx, next) => {
    const chatType = ctx.chat?.type;
    const username = ctx.from?.username;
    const chatId = ctx.chat?.id;
    const chatTitle = ctx.chat?.title || 'Личный чат';
    
    console.log(`[DEBUG] Message from @${username} in ${chatType}: ${ctx.message?.text?.substring(0, 50)}`);

    // Личный чат - только админ
    if (chatType === 'private') {
        if (username !== ADMIN_USERNAME) {
            console.warn(`[ACCESS DENIED] @${username} tried to use private chat`);
            return ctx.reply('❌ У вас нет доступа к этому боту.');
        }
        return next();
    }

    // Группа - пропускаем всё (пока просто логируем)
    console.log(`[ALLOWED] Group message in ${chatTitle} (${chatId})`);
    return next();
});

// Глобальный обработчик ошибок
process.on('uncaughtException', (err) => {
    console.error('[GLOBAL ERROR] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[GLOBAL ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Запуск бота
export async function startBot() {
    try {
        await bot.launch();
        console.log('✅ Бот успешно запущен');
        
        // Graceful stop
        process.once('SIGINT', () => bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot.stop('SIGTERM'));
    } catch (error) {
        console.error('❌ Ошибка при запуске бота:', error);
        throw error;
    }
}

export { bot };
