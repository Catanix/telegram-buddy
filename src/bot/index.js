import { Telegraf } from 'telegraf';
import { config } from 'dotenv';
import { setActualCommandList } from "../utils/commandList.js";
import { checkAccess } from "./middleware/checkAccess.js";
import { initBotHandlersActions, initBotCommandHandlers } from "./handlers/index.js";
import { initCommandsHandlersActions } from "./handlers/commands/index.js";

config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Middleware: проверка доступа (личный чат - только админ, группы - только разрешённые)
checkAccess(bot);

// Установка актуального листа команд
setActualCommandList(bot);

// Регистрация обработчика ошибок
initCommandsHandlersActions(bot);

// Установка обработки всех актуальных команд
initBotCommandHandlers(bot);

// Установка обработки всех актуальных действий
initBotHandlersActions(bot);

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
