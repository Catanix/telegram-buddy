import {statsHandler} from "./statsHandler.js";
import {musicSearchHandler} from "./musicSearchHandler.js";

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
        return ctx.reply('Привет! Боту можно отправлять ссылки на tiktok, youtube, instagram и т.д. в ответ он отправляет контент, так же с помощью голосового сообщения можно установить запланированную задачу и бот напомит о ней.');
    });

    // Обработка команды /stats
    bot.command('stats', (ctx) => {
        return statsHandler(ctx);
    });

    // Обработка команды поиска музыки /music
    bot.command('music', (ctx) => {
        return musicSearchHandler(ctx);
    });
};
