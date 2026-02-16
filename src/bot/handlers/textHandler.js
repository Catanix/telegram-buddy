import fs from 'fs';
import path from 'path';
import { Markup } from 'telegraf';
import { downloadInstagramMedia } from '../../services/media/instagram.js';
import { extractMediaUrls } from '../../utils/extractUrl.js';
import { downloadTikTokMedia } from '../../services/media/tiktok.js';
import { incrementStats } from '../../services/db.js';
import { getVideoInfo } from "../../services/media/youtube.js";
import { downloadXMedia, downloadXMediaFile, formatXMessage } from '../../services/media/x.js';

export async function textHandler(ctx, next) {
    try {
        const text = ctx.message.text;
        console.log(`[TEXT HANDLER] Got text: ${text.substring(0, 50)}`);

        // Skip command messages - pass to next handler
        if (text.startsWith('/')) {
            console.log('[TEXT HANDLER] Skipping command');
            return next();
        }

        // В группах авто-распаковка отключена - pass to next handler
        if (ctx.chat.type !== 'private') {
            console.log('[TEXT HANDLER] Skipping group chat');
            return next();
        }

        // В личных чатах - авто-распаковка
        console.log('[TEXT HANDLER] Extracting media...');
        const media = extractMediaUrls(text);
        console.log(`[TEXT HANDLER] Media found: ${JSON.stringify(media)}`);
        
        if (media && media.url.length > 0) {
            console.log(`[TEXT HANDLER] Processing ${media.type}...`);
            await handleMedia(ctx, media);
        } else {
            console.log('[TEXT HANDLER] No media found');
        }
        
        // Always continue to next handler
        return next();

    } catch (error) {
        console.error('[TextHandler Error]', error);
        return next();
    }
}

const handleMedia = async (ctx, media) => {
    let loadingMsg = null;
    
    try {
        loadingMsg = await ctx.reply(`⏳ Скачиваю с ${media.type}...`);
        console.log(`[DOWNLOAD START] ${media.type}: ${media.url}`);
        
        let result;
        if (media.type === 'instagram') {
            result = await downloadInstagramMedia(media.url);
        } else if (media.type === 'tiktok') {
            result = await downloadTikTokMedia(media.url);
        } else if (media.type === 'youtube') {
            const videoInfo = await getVideoInfo(media.url);

            if (videoInfo && videoInfo.formats.length > 0) {
                const buttons = videoInfo.formats.map(format => {
                    const audioItag = format.audioItag || '0';
                    const videoItag = format.videoItag || format.itag;
                    const audioTrackId = format.audioTrackId || '0';
                    const callbackData = `yt_dl|${videoInfo.videoId}|${videoItag}|${audioItag}|${audioTrackId}`;
                    return Markup.button.callback(
                        `${format.quality} (${format.sizeMB}MB)`,
                        callbackData
                    );
                });

                const imagePath = path.resolve('src/assets/images/yukiTube.png');
                await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
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
                return;
            } else {
                throw new Error('No suitable YouTube formats found or video is too large.');
            }
        } else if (media.type === 'x') {
            const tweetData = await downloadXMedia(media.url);

            if (tweetData && tweetData.error === 'not_found') {
                await ctx.telegram.editMessageText(
                    ctx.chat.id,
                    loadingMsg.message_id,
                    null,
                    '❌ Твит не найден. Возможно, он был удален или аккаунт приватный.'
                ).catch(() => {});
                return;
            }

            if (tweetData) {
                await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
                const messageText = formatXMessage(tweetData);
                await ctx.reply(messageText, { disable_web_page_preview: false });

                if (tweetData.media && tweetData.media.length > 0) {
                    for (const item of tweetData.media) {
                        const downloadedMedia = await downloadXMediaFile(item.url, item.type);
                        if (downloadedMedia && downloadedMedia.filePath) {
                            if (downloadedMedia.mediaType === 'video') {
                                await ctx.replyWithVideo({ source: downloadedMedia.filePath });
                            } else {
                                await ctx.replyWithPhoto({ source: downloadedMedia.filePath });
                            }
                            fs.unlinkSync(downloadedMedia.filePath);
                        }
                    }
                }
                await incrementStats(ctx.from.id, 'x');
                console.log(`[DOWNLOAD SUCCESS] ${media.type}`);
                return;
            }
        }

        // Instagram and TikTok
        if (result && result.filePath) {
            await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
            await sendMedia(ctx, result);
            fs.unlinkSync(result.filePath);
            await incrementStats(ctx.from.id, media.type);
            console.log(`[DOWNLOAD SUCCESS] ${media.type}`);
        } else {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                loadingMsg.message_id,
                null,
                '❌ Не удалось загрузить медиа. Возможно, аккаунт приватный или контент недоступен.'
            ).catch(() => {});
            console.error(`[DOWNLOAD FAILED] ${media.type}: ${media.url}`);
        }
    } catch (error) {
        console.error('[DOWNLOAD ERROR]', error);
        if (loadingMsg) {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                loadingMsg.message_id,
                null,
                `❌ Ошибка: ${error.message || 'не удалось скачать'}`
            ).catch(() => {});
        }
    }
}

async function sendMedia(ctx, media) {
    try {
        const { filePath, mediaType } = media;

        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }

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
