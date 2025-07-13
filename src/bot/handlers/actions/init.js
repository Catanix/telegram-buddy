import { setupConfirmHandler } from "../voiceHandler.js";
import { registerMusicActions } from "../commands/musicSearchHandler.js";
import { textHandler } from "../textHandler.js";
import { registerYoutubeDownloadAction } from "./youtubeDownloadAction.js";

export const initBotHandlersActions = (bot) => {
    bot.on('text', textHandler);
    setupConfirmHandler(bot);
    registerMusicActions(bot);
    registerYoutubeDownloadAction(bot);
}
