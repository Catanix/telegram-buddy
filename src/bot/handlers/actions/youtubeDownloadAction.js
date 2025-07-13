import fs from 'fs';
import ytdl from '@distube/ytdl-core';
import { downloadVideoByItag } from '../../../services/media/youtube.js';
import { incrementStats } from '../../../services/db.js';

export const registerYoutubeDownloadAction = (bot) => {
    // Callback data format: yt_dl|videoId|videoItag|audioItag
    bot.action(/yt_dl\|(.+?)\|(\d+)\|(\d+)/, async (ctx) => {
        try {
            const [_, videoId, videoItagStr, audioItagStr] = ctx.match;
            const videoItag = parseInt(videoItagStr, 10);
            const audioItag = audioItagStr === '0' ? null : parseInt(audioItagStr, 10);
            const userId = ctx.from.id;

            // 1. Delete the message with the quality selection buttons
            await ctx.deleteMessage();

            // 2. Send a notification that the download is starting
            const statusMsg = await ctx.reply('⏳ Получаю информацию о видео...');

            // 3. Get video info again to get the title
            const info = await ytdl.getInfo(videoId);
            const title = info.videoDetails.title;

            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                '⏳ Скачиваю и обрабатываю видео, это может занять некоторое время...'
            );

            // 4. Download the video
            const result = await downloadVideoByItag(videoId, videoItag, audioItag, title);

            if (result && result.filePath) {
                // 5. Send the video file
                await ctx.replyWithVideo({ source: result.filePath }, {
                    caption: `✅ Готово: ${title}`
                });

                // 6. Delete the temporary status message
                await ctx.deleteMessage(statusMsg.message_id);

                // 7. Clean up the downloaded file
                fs.unlinkSync(result.filePath);

                // 8. Increment stats
                await incrementStats(userId, 'youtube');

            } else {
                throw new Error('Не удалось скачать видеофайл.');
            }

        } catch (error) {
            console.error('[YouTube Action Error]', error);
            await ctx.reply(`❌ Ошибка при скачивании видео: ${error.message}`);
        }
    });
};
