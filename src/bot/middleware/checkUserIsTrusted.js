export const checkUserIsTrusted = (bot, authorizedUsername) => {
    bot.use(async (ctx, next) => {
        const username = ctx.from?.username;

        if (username !== authorizedUsername) {
            console.warn(`[ACCESS DENIED] @${username} tried to use the bot`);
            try {
                await ctx.reply('❌ У вас нет доступа к этому боту.');
            } catch (e) {
                console.error('Ошибка при отправке отказа в доступе:', e.message);
            }
            return;
        }

        return next();
    });
}
