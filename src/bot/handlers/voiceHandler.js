import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { convertToWav } from '../../utils/convertToWav.js';
import { transcribeOffline } from '../../utils/transcribeOffline.js';
import { askDeepSeek } from '../../services/deepseek.js';
import { insertTask } from '../../models/TaskModel.js';
import { formatDateForCIS, convertToISODate } from '../../utils/dateParser.js';

const pendingTasks = new Map(); // временное хранилище задач по ID

export async function voiceHandler(ctx) {
    const fileId = ctx.message.voice.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    const tmpDir = 'tmp';
    const oggPath = path.join(tmpDir, `${fileId}.ogg`);
    const wavPath = path.join(tmpDir, `${fileId}.wav`);

    try {
        const res = await fetch(fileLink);
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(oggPath, Buffer.from(buffer));

        await convertToWav(oggPath, wavPath);

        const transcript = await transcribeOffline(wavPath);
        if (!transcript) {
            const errorMsg = await ctx.reply('🤔 Не удалось распознать речь.');
            // Удаляем сообщение об ошибке через 5 секунд
            setTimeout(async () => {
                try {
                    await ctx.deleteMessage(errorMsg.message_id);
                } catch (error) {
                    console.error('[Delete Error Message Error]', error);
                }
            }, 5000);
            return;
        }

        const { task, time } = await askDeepSeek(transcript);
        if (!task || !time) {
            const errorMsg = await ctx.reply('❌ Не удалось извлечь задачу и время из текста.');
            // Удаляем сообщение об ошибке через 5 секунд
            setTimeout(async () => {
                try {
                    await ctx.deleteMessage(errorMsg.message_id);
                } catch (error) {
                    console.error('[Delete Error Message Error]', error);
                }
            }, 5000);
            return;
        }

        const taskId = uuidv4().slice(0, 8);
        pendingTasks.set(taskId, { task, time });
        const imagePath = path.resolve('src/assets/images/yukiTask.png');
        const isoTime = convertToISODate(time);
        const formattedTime = formatDateForCIS(isoTime);
        await ctx.replyWithPhoto(
            { source: fs.readFileSync(imagePath) },
            {
                caption: `🫡 Вы хотите поставить задачу:\n*👉🏻${task}*\n🕒 *${formattedTime}*`,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '✅ Подтвердить',
                            callback_data: `confirm_${taskId}`
                        }
                    ]]
                }
            }
        );
    } catch (err) {
        console.error('[VoiceHandler Error]', err);
        const errorMsg = await ctx.reply('⚠️ Ошибка при обработке голосового сообщения.');
        // Удаляем сообщение об ошибке через 5 секунд
        setTimeout(async () => {
            try {
                await ctx.deleteMessage(errorMsg.message_id);
            } catch (error) {
                console.error('[Delete Error Message Error]', error);
            }
        }, 5000);
    } finally {
        fs.existsSync(oggPath) && fs.unlinkSync(oggPath);
        fs.existsSync(wavPath) && fs.unlinkSync(wavPath);
    }
}

export function setupConfirmHandler(bot) {
    bot.on('callback_query', async (ctx) => {
        const data = ctx.callbackQuery.data;
        if (data.startsWith('confirm_')) {
            const taskId = data.slice('confirm_'.length);
            const entry = pendingTasks.get(taskId);
            if (!entry) {
                await ctx.answerCbQuery('⚠️ Задача не найдена', { show_alert: true });
                return;
            }

            const { task, time } = entry;
            const chatId = ctx.callbackQuery.message.chat.id;
            const messageId = ctx.callbackQuery.message.message_id;

            try {
                // Сохраняем задачу в базу данных
                await insertTask(chatId, task, time);

                // Удаляем сообщение с подтверждением
                await ctx.deleteMessage(messageId);

                // Convert the date to ISO format before formatting it for display
                const isoDate = convertToISODate(time);
                await ctx.reply(`✅ Сохранено!\n\n📋 ${task}\n🕒 ${formatDateForCIS(isoDate)}`);

                await ctx.answerCbQuery();
            } catch (error) {
                console.error('[Task Save Error]', error);

                // Удаляем сообщение с подтверждением
                try {
                    await ctx.deleteMessage(messageId);
                } catch (deleteError) {
                    console.error('[Delete Message Error]', deleteError);
                }

                const errorMsg = await ctx.reply('⚠️ Ошибка при сохранении задачи.');
                // Удаляем сообщение об ошибке через 5 секунд
                setTimeout(async () => {
                    try {
                        await ctx.deleteMessage(errorMsg.message_id);
                    } catch (error) {
                        console.error('[Delete Error Message Error]', error);
                    }
                }, 5000);
                await ctx.answerCbQuery('Произошла ошибка', { show_alert: true });
            }

            pendingTasks.delete(taskId);
        }
    });
}

function escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
