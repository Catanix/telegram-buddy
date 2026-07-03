import fs from 'fs';
import path from 'path';
import { downloadInstagramMedia } from '../../services/media/instagram.js';
import { extractMediaUrls } from '../../utils/extractUrl.js';
import { downloadTikTokMedia } from '../../services/media/tiktok.js';
import { incrementStats } from '../../services/db.js';
import { downloadYouTubeMedia } from '../../services/media/youtube.js';
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
            result = await downloadYouTubeMedia(media.url);
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

        // Instagram returns { files: [...] }
        if (media.type === 'instagram' && result && result.files && result.files.length > 0) {
            await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
            
            if (result.files.length === 1) {
                await sendMedia(ctx, result.files[0]);
            } else {
                // Send as media group (carousel)
                await sendMediaGroup(ctx, result.files);
            }
            
            // Cleanup all files
            for (const file of result.files) {
                if (fs.existsSync(file.filePath)) {
                    fs.unlinkSync(file.filePath);
                }
            }
            await incrementStats(ctx.from.id, media.type);
            console.log(`[DOWNLOAD SUCCESS] ${media.type}: ${result.files.length} files`);
            return;
        }

        // TikTok and YouTube return { filePath, mediaType }
        if (result && result.filePath) {
            await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
            await sendMedia(ctx, result);
            fs.unlinkSync(result.filePath);
            await incrementStats(ctx.from.id, media.type);
            console.log(`[DOWNLOAD SUCCESS] ${media.type}`);
            return;
        }

        await ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMsg.message_id,
            null,
            '❌ Не удалось загрузить медиа. Возможно, аккаунт приватный или контент недоступен.'
        ).catch(() => {});
        console.error(`[DOWNLOAD FAILED] ${media.type}: ${media.url}`);

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

async function sendMediaGroup(ctx, files) {
    try {
        const mediaGroup = files.map(file => {
            const type = file.mediaType === 'video' ? 'video' : 'photo';
            return { type, media: { source: file.filePath } };
        });

        await ctx.replyWithMediaGroup(mediaGroup);
    } catch (error) {
        console.error('SendMediaGroup Error:', error);
        // Fallback: send one by one
        for (const file of files) {
            await sendMedia(ctx, file);
        }
    }
}
