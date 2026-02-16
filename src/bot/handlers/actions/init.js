import { registerMusicActions } from "../commands/musicSearchHandler.js";
import { textHandler } from "../textHandler.js";
import { registerYoutubeDownloadAction } from "./youtubeDownloadAction.js";
import { registerGroupPermissionActions } from "./groupPermissionActions.js";
import { saveGroupMessage } from '../../services/db.js';

export const initBotHandlersActions = (bot) => {
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
