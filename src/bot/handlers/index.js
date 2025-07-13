import { setupConfirmHandler } from "./voiceHandler.js";
import { registerMusicActions } from "./commands/musicSearchHandler.js";
import { initBotCommandHandlers } from "./commands/index.js";
import { textHandler } from "./textHandler.js";

export const initBotHandlersActions = (bot) => {
    bot.on('text', textHandler);
    setupConfirmHandler(bot);
    registerMusicActions(bot);
}

export { initBotCommandHandlers };
