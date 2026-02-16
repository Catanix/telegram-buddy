import { statsHandler } from "./statsHandler.js";
import { musicSearchHandler } from "./musicSearchHandler.js";
import { unzipHandler, summaryHandler } from "./groupCommands.js";

export const initCommandsHandlersActions = (bot) => {
    // Обработка ошибок
    bot.catch((err, ctx) => {
        console.error('Ошибка бота:', err);
        ctx.reply('Произошла ошибка при обработке запроса.');
    });
};

export const initBotCommandHandlers = (bot) => {
    // Обработка команды /start
    bot.command('start', (ctx) => {
        const isGroup = ctx.chat.type !== 'private';
        
        if (isGroup) {
            return ctx.reply(
                '👋 Привет! Я бот для извлечения контента из социальных сетей.\n\n' +
                '📋 Доступные команды:\n' +
                '/unzip - извлечь контент по ссылке\n' +
                '/summary - саммаризация обсуждения\n\n' +
                '⏳ Ожидайте разрешения администратора.'
            );
        }
        
        return ctx.reply(
            '👋 Привет! Я бот для извлечения контента из социальных сетей.\n\n' +
            'Просто отправь мне ссылку на TikTok, YouTube, Instagram или X (Twitter), ' +
            'и я извлеку контент для тебя.\n\n' +
            '📋 Команды:\n' +
            '/music <запрос> - поиск музыки\n' +
            '/stats - статистика использования'
        );
    });

    // Обработка команды /stats
    bot.command('stats', (ctx) => {
        return statsHandler(ctx);
    });

    // Обработка команды поиска музыки /music
    bot.command('music', (ctx) => {
        return musicSearchHandler(ctx);
    });
    
    // Групповые команды
    bot.command('unzip', (ctx) => {
        return unzipHandler(ctx);
    });
    
    bot.command('summary', (ctx) => {
        return summaryHandler(ctx);
    });
};
