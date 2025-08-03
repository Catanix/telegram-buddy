import { setupConfirmHandler, voiceHandler } from "../voiceHandler.js";
import { registerMusicActions } from "../commands/musicSearchHandler.js";
import { textHandler } from "../textHandler.js";
import { registerYoutubeDownloadAction } from "./youtubeDownloadAction.js";

export const initBotHandlersActions = (bot) => {
    bot.on('text', textHandler);
    bot.on('voice', voiceHandler);
    setupConfirmHandler(bot);
    registerMusicActions(bot);
    registerYoutubeDownloadAction(bot);
}
