import { extractMediaUrls } from '../../../utils/extractUrl.js';
import { downloadTikTokMedia } from '../../../services/media/tiktok.js';
import { downloadInstagramMedia } from '../../../services/media/instagram.js';
import { getVideoInfo } from '../../../services/media/youtube.js';
import { downloadXMedia, downloadXMediaFile, formatXMessage } from '../../../services/media/x.js';
import { getGroupMessageHistory } from '../../../services/db.js';
import { summarizeMessages } from '../../../services/api/summarize.js';
import fs from 'fs';

/**
 * Команда /unzip - извлекает контент по ссылке
 * Работает с последней ссылкой в чате или с reply на сообщение со ссылкой
 */
export async function unzipHandler(ctx) {
    try {
        let targetMessage = ctx.message;
        
        // Если команда в reply на другое сообщение - берём то сообщение
        if (ctx.message.reply_to_message) {
            targetMessage = ctx.message.reply_to_message;
        }
        
        const text = targetMessage.text || targetMessage.caption || '';
        const media = extractMediaUrls(text);
        
        if (!media || media.url.length === 0) {
            return ctx.reply(
                '❌ Не нашёл ссылку на поддерживаемый контент.\n\n' +
                'Использование:\n' +
                '• Ответьте /unzip на сообщение со ссылкой\n' +
                '• Или просто отправьте /unzip после сообщения со ссылкой',
                { reply_to_message_id: ctx.message.message_id }
            );
        }
        
        const loadingMsg = await ctx.reply('⏳ Извлекаю контент...', {
            reply_to_message_id: ctx.message.message_id
        });
        
        let result;
        let messageText = '';
        
        switch (media.type) {
            case 'tiktok':
                result = await downloadTikTokMedia(media.url);
                break;
            case 'instagram':
                result = await downloadInstagramMedia(media.url);
                break;
            case 'youtube':
                const videoInfo = await getVideoInfo(media.url);
                if (videoInfo) {
                    messageText = `🎬 *${videoInfo.title}*\n\n🔗 ${media.url}`;
                }
                break;
            case 'x':
                const tweetData = await downloadXMedia(media.url);
                if (tweetData && !tweetData.error) {
                    messageText = formatXMessage(tweetData);
                    
                    // Удаляем loading сообщение
                    await ctx.deleteMessage(loadingMsg.message_id);
                    
                    // Отправляем текст
                    await ctx.reply(messageText, { 
                        parse_mode: 'MarkdownV2',
                        reply_to_message_id: ctx.message.message_id
                    });
                    
                    // Отправляем медиа если есть
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
                    return;
                }
                break;
            default:
                return ctx.reply('❌ Неподдерживаемый тип ссылки.');
        }
        
        // Для TikTok и Instagram
        if (result && result.filePath) {
            await ctx.deleteMessage(loadingMsg.message_id);
            
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
        } else if (media.type === 'youtube' && messageText) {
            await ctx.deleteMessage(loadingMsg.message_id);
            await ctx.reply(messageText, { 
                parse_mode: 'Markdown',
                reply_to_message_id: ctx.message.message_id
            });
        } else {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                loadingMsg.message_id,
                null,
                '❌ Не удалось загрузить контент.'
            );
        }
        
    } catch (error) {
        console.error('[UnzipHandler Error]', error);
        ctx.reply('❌ Ошибка при обработке запроса.');
    }
}

/**
 * Команда /summary - создаёт саммаризацию последних сообщений
 */
export async function summaryHandler(ctx) {
    try {
        const loadingMsg = await ctx.reply(
            '🧠 Анализирую последние сообщения...',
            { reply_to_message_id: ctx.message.message_id }
        );
        
        // Получаем последние 100 сообщений (или сколько есть)
        const messages = await getGroupMessageHistory(ctx.chat.id, 100);
        
        if (!messages || messages.length === 0) {
            await ctx.deleteMessage(loadingMsg.message_id);
            return ctx.reply('❌ Нет сохранённых сообщений для саммаризации.');
        }
        
        // Создаём саммаризацию через DeepSeek
        const summary = await summarizeMessages(messages);
        
        await ctx.deleteMessage(loadingMsg.message_id);
        
        if (summary) {
            await ctx.reply(
                `📋 *Саммаризация обсуждения* (${messages.length} сообщений)\n\n${summary}`,
                { 
                    parse_mode: 'Markdown',
                    reply_to_message_id: ctx.message.message_id
                }
            );
        } else {
            await ctx.reply('❌ Не удалось создать саммаризацию.');
        }
        
    } catch (error) {
        console.error('[SummaryHandler Error]', error);
        ctx.reply('❌ Ошибка при создании саммаризации.');
    }
}
