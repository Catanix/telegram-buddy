import { downloadMusic, searchMusic } from "../../../services/media/music.js";
import path from "path";
import fs from "fs";
import {incrementStats} from "../../../services/db.js";

const trackStore = new Map();

export const musicSearchHandler = async (ctx) => {
    const query = ctx.message.text.replace(/^\/music(@\w+)?\s*/, '').trim();

    if (!query) {
        return ctx.reply('❗️ Укажи название трека, например:\n`/music Fallen mc - как Руслан Гительман`', { parse_mode: 'Markdown' });
    }

    try {
        const results = await searchMusic(query);

        if (results.length === 0) {
            return ctx.reply('😔 Ничего не найдено.');
        }

        const userId = ctx.from.id.toString();
        trackStore.set(userId, new Map());

        const buttons = results.map((result, index) => {
            const trackId = `${userId}_${index}`;

            trackStore.get(userId).set(trackId, {
                url: result.url,
                artist: result.artist,
                track: result.track,
                messageId: null // Will be set after sending the message
            });

            return {
                text: `🎵 ${result.artist} - ${result.track}`,
                callback_data: `t:${trackId}`
            };
        });

        const inline_keyboard = buttons.map(button => [button]);
        const imagePath = path.resolve('src/assets/images/yukiMusic.png');

        const message = await ctx.replyWithPhoto(
            { source: imagePath },
            {
                caption: 'Выбери нужный трек:',
                reply_markup: {
                    inline_keyboard
                }
            }
        );

        // Store message ID for each track to delete it later
        for (const trackId of trackStore.get(userId).keys()) {
            const trackInfo = trackStore.get(userId).get(trackId);
            trackInfo.messageId = message.message_id;
        }

        setTimeout(() => {
            trackStore.delete(userId);
        }, 3600000);

    } catch (error) {
        console.error('Ошибка при поиске музыки:', error);
        await ctx.reply('❌ Произошла ошибка при поиске музыки.');
    }
};

export const registerMusicActions = (bot) => {
    bot.action(/t:.+/, async (ctx) => {
        try {
            const trackId = ctx.callbackQuery.data.replace('t:', '');
            const userId = trackId.split('_')[0];

            if (!trackStore.has(userId) || !trackStore.get(userId).has(trackId)) {
                return await ctx.answerCbQuery('Информация о треке устарела. Выполните поиск заново.');
            }

            const trackInfo = trackStore.get(userId).get(trackId);

            // Delete the message with track selection
            if (trackInfo.messageId) {
                try {
                    await ctx.deleteMessage(trackInfo.messageId);
                } catch (deleteError) {
                    console.error('Ошибка при удалении сообщения:', deleteError.message);
                }
            }

            // Send a notification that the track is being downloaded
            await ctx.answerCbQuery('Скачиваю трек...');

            try {
                // Send a temporary message to indicate that the download is in progress
                const statusMsg = await ctx.reply('⏳ Скачиваю трек, пожалуйста подождите...');

                const filePath = await downloadMusic(trackInfo.url, trackInfo.artist, trackInfo.track);

                // Send the audio file
                await ctx.replyWithAudio({ source: filePath }, {
                    caption: `🎵 ${trackInfo.artist} - ${trackInfo.track}`
                });

                // Delete the temporary status message
                await ctx.deleteMessage(statusMsg.message_id);

                // 📊 Increment stats
                await incrementStats(ctx.from.id, 'music');

                // Delete the downloaded file after sending
                fs.unlinkSync(filePath);
            } catch (downloadError) {
                console.error('Ошибка при скачивании:', downloadError);
                await ctx.reply('❌ Не удалось скачать трек. Попробуйте другой.');
            }
        } catch (err) {
            console.error('Ошибка в обработчике музыки:', err);
            await ctx.answerCbQuery('Произошла ошибка').catch(console.error);
        }
    });
};
