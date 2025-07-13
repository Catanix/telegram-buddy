import fs from 'fs';
import path from 'path';
import { Markup } from 'telegraf';
import { downloadInstagramMedia } from '../../services/media/instagram.js';
import { extractMediaUrls } from '../../utils/extractUrl.js';
import { downloadTikTokMedia } from '../../services/media/tiktok.js';
import { incrementStats } from '../../services/db.js';
import { getVideoInfo } from "../../services/media/youtube.js";

export async function textHandler(ctx) {
    try {
        const text = ctx.message.text;

        // Skip command messages
        if (text.startsWith('/')) {
            return;
        }

        // Check if the message contains an media link
        const media = extractMediaUrls(text);

        if (media && media.url.length > 0) {
            await handleMedia(ctx, media);
        }

    } catch (error) {
        console.error('[TextHandler Error]', error);
    }
}

const handleMedia = async (ctx, media) => {
    // Send a loading message
    const loadingMsg = await ctx.reply(`⏳ Обрабатываю ссылку с ${media.type}...`);

    try {
        let result;
        if (media.type === 'instagram') {
            result = await downloadInstagramMedia(media.url);
        } else if (media.type === 'tiktok') {
            result = await downloadTikTokMedia(media.url);
        } else if (media.type === 'youtube') {
            // New YouTube flow
            const videoInfo = await getVideoInfo(media.url);

            if (videoInfo && videoInfo.formats.length > 0) {
                const buttons = videoInfo.formats.map(format => {
                    // Callback data format: yt_dl|videoId|videoItag|audioItag
                    const audioItag = format.audioItag || '0'; // Use '0' if no separate audio
                    const videoItag = format.videoItag || format.itag;
                    const callbackData = `yt_dl|${videoInfo.videoId}|${videoItag}|${audioItag}`;
                    return Markup.button.callback(
                        `${format.quality} (${format.sizeMB}MB)`,
                        callbackData
                    );
                });

                const imagePath = path.resolve('src/assets/images/yukiTube.png');
                await ctx.replyWithPhoto(
                    { source: imagePath },
                    {
                        caption: `🎬 *${videoInfo.title}*\n\nВыберите качество для скачивания:`,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [buttons]
                        }
                    }
                );
                // Delete the loading message as we've sent the quality selection
                return await ctx.deleteMessage(loadingMsg.message_id);

            } else {
                // If no suitable formats are found, handle it as an error
                throw new Error('No suitable YouTube formats found or video is too large.');
            }
        }

        // This part remains for Instagram and TikTok
        if (result && result.filePath) {
            // Delete the loading message
            await ctx.deleteMessage(loadingMsg.message_id);

            // Send the media back to the user
            await sendMedia(ctx, result);
            fs.unlinkSync(result.filePath);

            // Increment stats
            await incrementStats(ctx.from.id, media.type);
        } else if (media.type !== 'youtube') { // Avoid double error message for youtube
            // Update the loading message with an error
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                loadingMsg.message_id,
                null,
                '❌ Не удалось загрузить медиа. Возможно, аккаунт приватный или контент недоступен.'
            );
            console.error(`Failed to download media from: ${media.url}`);
        }
    } catch (error) {
        // Update the loading message with an error
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMsg.message_id,
            null,
            `❌ Произошла ошибка: ${error.message || `при обработке ссылки ${media.type}`}.`
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

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }

        // Send the media based on its type
        if (mediaType === 'video') {
            await ctx.replyWithVideo({ source: filePath });
        } else {
            await ctx.replyWithPhoto({ source: filePath });
        }
    } catch (error) {
        console.error('SendMedia Error:', error);
        await ctx.reply('❌ Не удалось отправить медиа.');
    }
}
