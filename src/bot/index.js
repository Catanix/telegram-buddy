import { Telegraf } from 'telegraf';
import { config } from 'dotenv';
import { voiceHandler, setupConfirmHandler } from './handlers/voiceHandler.js';
import { textHandler } from './handlers/textHandler.js';

config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const authorizedUsername = process.env.AUTHORIZED_USERNAME;

// ✅ Middleware: проверка username
bot.use(async (ctx, next) => {
    const username = ctx.from?.username;

    if (username !== authorizedUsername) {
        console.warn(`[ACCESS DENIED] @${username} tried to use the bot`);
        try {
            await ctx.reply('❌ У вас нет доступа к этому боту.');
        } catch (e) {
            console.error('❌ Ошибка при отправке отказа в доступе:', e.message);
        }
        return;
    }

    return next();
});

// 🎤 Обработка голосовых сообщений
bot.on('voice', (ctx) => voiceHandler(ctx, bot));

// 📝 Обработка текстовых сообщений (для Instagram)
bot.on('text', textHandler);

// ✅ Обработка callback-кнопки подтверждения задачи
setupConfirmHandler(bot);

// 🚀 Запуск бота
export async function startBot() {
    await bot.launch();
    console.log('🤖 Бот запущен');
}

export { bot };
