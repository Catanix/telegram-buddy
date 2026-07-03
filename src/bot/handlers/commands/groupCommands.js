import fs from 'fs';
import { extractMediaUrls } from '../../../utils/extractUrl.js';
import { downloadTikTokMedia } from '../../../services/media/tiktok.js';
import { downloadInstagramMedia } from '../../../services/media/instagram.js';
import { downloadYouTubeMedia } from '../../../services/media/youtube.js';
import { downloadXMedia, downloadXMediaFile, formatXMessage } from '../../../services/media/x.js';
import { getRecentMessages } from '../../../services/database/index.js';
import { summarizeMessages } from '../../../services/api/summarize.js';
import { logger } from '../../../utils/logger.js';

/**
 * /unzip command - extract content from social media links
 * @param {Context} ctx 
 */
export async function unzipHandler(ctx) {
    let loadingMsg = null;
    
    try {
        const messageText = ctx.message.text || '';
        const commandArgs = messageText.replace(/\/unzip(@\w+)?/, '').trim();
        
        let targetMessage = ctx.message;
        let text = '';
        
        // Check if replying to another message
        if (ctx.message.reply_to_message) {
            targetMessage = ctx.message.reply_to_message;
            text = targetMessage.text || targetMessage.caption || '';
        } else if (commandArgs) {
            text = commandArgs;
        } else {
            text = targetMessage.text || targetMessage.caption || '';
        }
        
        logger.debug(`Unzip: extracting from "${text.substring(0, 50)}"`);
        const media = extractMediaUrls(text);
        
        if (!media || !media.url) {
            return ctx.reply(
                '❌ Не нашёл ссылку на поддерживаемый контент.\n\n' +
                '📝 Как использовать /unzip:\n' +
                '• Ответьте /unzip на сообщение со ссылкой (Instagram, TikTok, YouTube или X)\n' +
                '• Или отправьте /unzip <ссылка>',
                { reply_to_message_id: ctx.message.message_id }
            );
        }
        
        loadingMsg = await ctx.reply('⏳ Извлекаю контент...', {
            reply_to_message_id: ctx.message.message_id
        });
        
        let result;
        let responseText = '';
        
        switch (media.type) {
            case 'tiktok':
                result = await downloadTikTokMedia(media.url);
                break;
            case 'instagram':
                result = await downloadInstagramMedia(media.url);
                break;
            case 'youtube':
                result = await downloadYouTubeMedia(media.url);
                break;
            case 'x':
                const tweetData = await downloadXMedia(media.url);
                if (tweetData && !tweetData.error) {
                    responseText = formatXMessage(tweetData);
                    await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
                    await ctx.reply(responseText, { reply_to_message_id: ctx.message.message_id });
                    
                    if (tweetData.media?.length > 0) {
                        for (const item of tweetData.media) {
                            const downloaded = await downloadXMediaFile(item.url, item.type);
                            if (downloaded?.filePath) {
                                if (downloaded.mediaType === 'video') {
                                    await ctx.replyWithVideo({ source: downloaded.filePath });
                                } else {
                                    await ctx.replyWithPhoto({ source: downloaded.filePath });
                                }
                                fs.unlinkSync(downloaded.filePath);
                            }
                        }
                    }
                    return;
                }
                break;
            default:
                await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
                return ctx.reply('❌ Неподдерживаемый тип ссылки.');
        }
        
        // Handle Instagram (returns { files: [...] })
        if (media.type === 'instagram' && result?.files?.length > 0) {
            await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
            
            if (result.files.length === 1) {
                const file = result.files[0];
                if (file.mediaType === 'video') {
                    await ctx.replyWithVideo(
                        { source: file.filePath },
                        { reply_to_message_id: ctx.message.message_id }
                    );
                } else {
                    await ctx.replyWithPhoto(
                        { source: file.filePath },
                        { reply_to_message_id: ctx.message.message_id }
                    );
                }
            } else {
                // Carousel: send as media group
                const mediaGroup = result.files.map(file => ({
                    type: file.mediaType === 'video' ? 'video' : 'photo',
                    media: { source: file.filePath }
                }));
                await ctx.replyWithMediaGroup(mediaGroup, {
                    reply_to_message_id: ctx.message.message_id
                });
            }
            
            // Cleanup
            for (const file of result.files) {
                if (fs.existsSync(file.filePath)) {
                    fs.unlinkSync(file.filePath);
                }
            }
        } 
        // Handle TikTok and YouTube (returns { filePath, mediaType })
        else if (result?.filePath) {
            await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
            
            if (result.mediaType === 'video') {
                await ctx.replyWithVideo(
                    { source: result.filePath },
                    { reply_to_message_id: ctx.message.message_id }
                );
            } else {
                await ctx.replyWithPhoto(
                    { source: result.filePath },
                    { reply_to_message_id: ctx.message.message_id }
                );
            }
            
            fs.unlinkSync(result.filePath);
        } else {
            await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
            await ctx.reply('❌ Не удалось извлечь контент.').catch(() => {});
        }
        
    } catch (error) {
        logger.error('Unzip error:', error);
        if (loadingMsg) {
            await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
        }
        await ctx.reply('❌ Ошибка при извлечении контента.').catch(() => {});
    }
}

/**
 * /summary command - summarize recent messages
 * @param {Context} ctx 
 */
export async function summaryHandler(ctx) {
    let loadingMsg = null;
    
    try {
        const chatId = ctx.chat.id;
        
        loadingMsg = await ctx.reply('⏳ Анализирую сообщения...', {
            reply_to_message_id: ctx.message.message_id
        });
        
        // Get recent messages
        const messages = await getRecentMessages(chatId, 100);
        
        logger.info(`Retrieved ${messages?.length || 0} messages for summary`);
        
        if (!Array.isArray(messages) || messages.length === 0) {
            await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
            return ctx.reply('❌ Нет сохранённых сообщений для саммаризации.');
        }
        
        // Get summary (pass messages array, not formatted string)
        const summary = await summarizeMessages(messages);
        
        await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
        
        if (summary) {
            // Убираем @ из ответа на всякий случай
            const cleanSummary = summary.replace(/@(\w+)/g, '$1');
            await ctx.reply(`📋 Короче, в чате творилось:\n\n${cleanSummary}`, {
                reply_to_message_id: ctx.message.message_id
            });
        } else {
            await ctx.reply('❌ Не удалось создать саммаризацию.', {
                reply_to_message_id: ctx.message.message_id
            });
        }
        
    } catch (error) {
        logger.error('Summary error:', error);
        if (loadingMsg) {
            await ctx.deleteMessage(loadingMsg.message_id).catch(() => {});
        }
        await ctx.reply('❌ Ошибка при создании саммаризации.').catch(() => {});
    }
}
