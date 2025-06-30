import fs from 'fs';
import path from 'path';
import { getCurrentMinuteTasks, markTaskAsNotified, cleanupOldTasks, getOverdueTasks } from '../models/TaskModel.js';
import { formatDateForDisplay } from '../utils/dateUtils.js';

export async function startScheduler(bot) {
    await checkExistingTasks(bot);

    setInterval(async () => {
        try {
            await cleanupOldTasks();
            await checkDueTasks(bot);
        } catch (err) {
            console.error('[Scheduler Error]', err);
        }
    }, 5 * 1000);
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

        if (dueTasks.length > 0) {
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
        }
    } catch (err) {
        console.error('[Check Existing Tasks Error]', err);
    }
}
