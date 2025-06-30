import fs from 'fs';
import path from 'path';
import { getCurrentMinuteTasks, markTaskAsNotified, cleanupOldTasks, getOverdueTasks, getPendingTasks } from '../models/TaskModel.js';
import { formatDateForDisplay } from '../utils/dateUtils.js';

export async function startScheduler(bot) {
    await checkExistingTasks(bot);

    setInterval(async () => {
        try {
            await cleanupOldTasks();
            await checkDueTasks(bot);
            await logNextTaskTime();
        } catch (err) {
            console.error('[Scheduler Error]', err);
        }
    }, 10 * 1000); // 10 секунд
}

async function checkDueTasks(bot) {
    try {
        const tasks = await getCurrentMinuteTasks();
        console.log(`Найдено ${tasks.length} задач для выполнения в текущую минуту`);

        for (const task of tasks) {
            try {
                const imagePath = path.resolve('src/assets/images/yukiTele.png');
                const formattedMessage =
                    `🔔 Напоминание!\n\n` +
                    `✅ ${task.text}\n` +
                    `🕒 Дата: ${formatDateForDisplay(task.remind_at)}`;

                await bot.telegram.sendPhoto(
                    task.chat_id,
                    { source: fs.readFileSync(imagePath) },
                    { caption: formattedMessage }
                );
                console.log(`Напоминание отправлено для задачи ${task.id}`);

                await markTaskAsNotified(task.id);
            } catch (sendError) {
                console.error(`Ошибка при отправке напоминания для задачи ${task.id}:`, sendError);
            }
        }
    } catch (err) {
        console.error('[Check Due Tasks Error]', err);
    }
}

async function checkExistingTasks(bot) {
    try {
        console.log('Проверка существующих задач при запуске бота');

        await cleanupOldTasks();

        const dueTasks = await getCurrentMinuteTasks();
        console.log(`Найдено ${dueTasks.length} задач для выполнения в текущую минуту`);

        for (const task of dueTasks) {
            try {
                const imagePath = path.resolve('src/assets/images/yukiTele.png');
                const formattedMessage =
                    `🔔 Напоминание!\n\n` +
                    `✅ ${task.text}\n` +
                    `🕒 Дата: ${formatDateForDisplay(task.remind_at)}`;

                await bot.telegram.sendPhoto(
                    task.chat_id,
                    { source: fs.readFileSync(imagePath) },
                    { caption: formattedMessage }
                );
                console.log(`Напоминание отправлено для задачи ${task.id}`);

                await markTaskAsNotified(task.id);
            } catch (sendError) {
                console.error(`Ошибка при отправке напоминания для задачи ${task.id}:`, sendError);
            }
        }
    } catch (err) {
        console.error('[Check Existing Tasks Error]', err);
    }
}

async function logNextTaskTime() {
    const tasks = await getPendingTasks();
    if (!tasks.length) {
        console.log('⏳ Нет предстоящих задач');
        return;
    }

    const now = new Date();
    const nextTask = tasks.reduce((min, t) =>
        new Date(t.remind_at) < new Date(min.remind_at) ? t : min
    );

    const diffMs = new Date(nextTask.remind_at) - now;
    const diffMin = Math.floor(diffMs / 60000);
    const diffSec = Math.floor((diffMs % 60000) / 1000);

    console.log(`⏳ До следующей задачи осталось: ${diffMin} мин ${diffSec} сек (${formatDateForDisplay(nextTask.remind_at)})`);
}
