import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { convertToWav } from '../../utils/convertToWav.js';
import { transcribeOffline } from '../../utils/transcribeOffline.js';
import { insertTask } from '../../models/TaskModel.js';
import { formatDateForDisplay } from '../../utils/dateUtils.js';
import { incrementStats } from '../../services/db.js';
import { askLM } from "../../services/api/lm_api.js";

const pendingTasks = new Map();

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

        if (!transcript) return await ctx.reply('🤔 Не удалось распознать речь.');

        const { task, time } = await askLM(transcript);
        if (!task || !time) return await ctx.reply('❌ Не удалось извлечь задачу и время.');

        const taskId = uuidv4().slice(0, 8);
        pendingTasks.set(taskId, { task, time });

        const imagePath = path.resolve('src/assets/images/yukiTask.png');
        const formattedTime = formatDateForDisplay(time);

        await ctx.replyWithPhoto(
            { source: fs.readFileSync(imagePath) },
            {
                caption: `🫡 Вы хотите поставить задачу:\n*👉🏻${task}*\n🕒 *${formattedTime}*`,
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '✅ Подтвердить', callback_data: `confirm_${taskId}` }
                    ]]
                }
            }
        );
    } catch (err) {
        console.error('[VoiceHandler Error]', err);
        await ctx.reply('⚠️ Ошибка при обработке голосового сообщения.');
    } finally {
        fs.existsSync(oggPath) && fs.unlinkSync(oggPath);
        fs.existsSync(wavPath) && fs.unlinkSync(wavPath);
    }
}

export function setupConfirmHandler(bot) {
    bot.on('callback_query', async (ctx) => {
        const data = ctx.callbackQuery.data;
        if (!data.startsWith('confirm_')) return;

        const taskId = data.slice('confirm_'.length);
        const entry = pendingTasks.get(taskId);
        if (!entry) return await ctx.answerCbQuery('⚠️ Задача не найдена', { show_alert: true });

        const { task, time } = entry;
        try {
            await insertTask(ctx.chat.id, task, time);
            await incrementStats(ctx.from.id, 'task'); // 📊 Increment stats
            await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
            await ctx.reply(`✅ Сохранено!\n\n📋 ${task}\n🕒 ${formatDateForDisplay(time)}`);
            await ctx.answerCbQuery();
        } catch (e) {
            console.error('[Task Save Error]', e);
            await ctx.reply('⚠️ Ошибка при сохранении задачи.');
            await ctx.answerCbQuery('Произошла ошибка', { show_alert: true });
        }
        pendingTasks.delete(taskId);
    });
}
