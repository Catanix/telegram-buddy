import fs from 'fs';
import { downloadInstagramMedia } from '../../services/instagram.js';
import { extractMediaUrls } from '../../utils/extractUrl.js';
import {downloadTikTokMedia} from "../../services/tiktok.js";

export async function textHandler(ctx) {
    try {
        const text = ctx.message.text;

        // Check if the message contains an media link
        const media = extractMediaUrls(text);

        if (media.url.length > 0) {
            await handleMedia(ctx, media);
        }

    } catch (error) {
        console.error('[TextHandler Error]', error);
    }
}

const handleMedia = async (ctx, media) => {
    const type = media ? 'Instagram' : 'TikTok';

    // Send a loading message
    const loadingMsg = await ctx.reply(`⏳ Загрузка медиа с ${media.type}...`);

    try {
        let result;
        if (media.type === 'instagram') {
            result = await downloadInstagramMedia(media.url);
        }
        if (media.type === 'tiktok') {
            result = await downloadTikTokMedia(media.url);
        }

        if (result && result.filePath) {
            // Delete the loading message
            await ctx.deleteMessage(loadingMsg.message_id);

            // Send the media back to the user
            await sendMedia(ctx, result);
            fs.unlinkSync(result.filePath);

            console.log(`[TextHandler] Successfully processed ${media.type} URL: ${media.url}`);
        } else {
            // Update the loading message with an error
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                loadingMsg.message_id,
                null,
                '❌ Не удалось загрузить медиа. Возможно, аккаунт приватный или контент недоступен.'
            );
            console.error(`[TextHandler] Failed to download media from: ${media.url}`);
        }
    } catch (error) {
        // Update the loading message with an error
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMsg.message_id,
            null,
            '❌ Произошла ошибка при обработке ссылки ${media.type}.'
        );
        console.error('[TextHandler Error]', error);
    }
}

/**
 * Send media to the user based on the media type
 * @param {object} ctx - Telegram context
 * @param {object} media - Media object with filePath and mediaType
 */
async function sendMedia(ctx, media) {
    try {
        const { filePath, mediaType } = media;

        console.log(`[TextHandler] Sending ${mediaType} from file: ${filePath}`);

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }

        // Send the media based on its type
        if (mediaType === 'video') {
            // Send as video
            await ctx.replyWithVideo({ source: filePath });
        } else {
            // Send as photo
            await ctx.replyWithPhoto({ source: filePath });
        }

        console.log(`[TextHandler] Successfully sent ${mediaType} to user`);
    } catch (error) {
        console.error('[SendMedia Error]', error);
        await ctx.reply('❌ Не удалось отправить медиа.');
    }
}
