import fs from 'fs';
import path from 'path';
import { getOverdueTasks, markTaskAsNotified, cleanupOldTasks } from '../models/TaskModel.js';
import { formatDateForCIS } from '../utils/dateParser.js';

export async function startScheduler(bot) {
    // Проверяем наличие старых задач при запуске
    await checkExistingTasks(bot);

    // Запускаем регулярную проверку
    setInterval(async () => {
        try {
            await checkDueTasks(bot);
            await cleanupOldTasks(); // Удаляем старые выполненные задачи
        } catch (err) {
            console.error('[Scheduler Error]', err);
        }
    }, 60 * 1000); // проверка каждую минуту
}

// Проверка задач, срок которых наступил
async function checkDueTasks(bot) {
    try {
        console.log('🔍 Проверка задач, срок которых наступил...');
        const now = new Date();
        console.log(`🕒 Текущее время: ${now.toISOString()}`);

        const tasks = await getOverdueTasks();
        console.log(`📋 Найдено ${tasks.length} задач для напоминания`);

        for (const task of tasks) {
            console.log(`📤 Отправка напоминания для задачи ${task.id}: "${task.text}" (срок: ${task.remind_at})`);

            try {
                const imagePath = path.resolve('src/assets/images/yukiTele.png');
                const formattedMessage =
                    `🔔 Напоминание!\n\n` +
                    `✅ ${task.text}\n` +
                    `🕒 Дата: ${formatDateForCIS(task.remind_at)}`;

                await bot.telegram.sendPhoto(
                    task.chat_id,
                    { source: fs.readFileSync(imagePath) },
                    { caption: formattedMessage }
                );
                console.log(`✅ Напоминание отправлено для задачи ${task.id}`);

                await markTaskAsNotified(task.id);
                console.log(`✓ Задача ${task.id} помечена как уведомленная`);
            } catch (sendError) {
                console.error(`❌ Ошибка при отправке напоминания для задачи ${task.id}:`, sendError);
            }
        }
    } catch (err) {
        console.error('[Check Due Tasks Error]', err);
    }
}

// Проверка существующих задач при запуске бота
async function checkExistingTasks(bot) {
    try {
        console.log('🔍 Проверка существующих задач при запуске бота...');
        const now = new Date();
        console.log(`🕒 Текущее время: ${now.toISOString()}`);

        // Получаем просроченные задачи
        const overdueTasks = await getOverdueTasks();
        console.log(`📋 Найдено ${overdueTasks.length} просроченных задач`);

        if (overdueTasks.length > 0) {
            // Отправляем напоминания о просроченных задачах
            for (const task of overdueTasks) {
                console.log(`📤 Отправка напоминания для просроченной задачи ${task.id}: "${task.text}" (срок: ${task.remind_at})`);

                try {
                    const imagePath = path.resolve('src/assets/images/yukiTele.png');
                    const formattedMessage =
                        `⚠️ Просроченная задача\n\n` +
                        `Задача:\n\n` +
                        `${task.text}\n\n` +
                        `🕒 Должна была быть выполнена: ${formatDateForCIS(task.remind_at)}`;

                    await bot.telegram.sendPhoto(
                        task.chat_id,
                        { source: fs.readFileSync(imagePath) },
                        { caption: formattedMessage }
                    );
                    console.log(`✅ Напоминание отправлено для просроченной задачи ${task.id}`);

                    await markTaskAsNotified(task.id);
                    console.log(`✓ Просроченная задача ${task.id} помечена как уведомленная`);
                } catch (sendError) {
                    console.error(`❌ Ошибка при отправке напоминания для просроченной задачи ${task.id}:`, sendError);
                }
            }
        } else {
            console.log('✅ Просроченных задач не найдено');
        }

        console.log('🧹 Очистка старых выполненных задач...');
        await cleanupOldTasks();
        console.log('✅ Старые выполненные задачи очищены');

        console.log('✅ Проверка существующих задач завершена');
    } catch (err) {
        console.error('[Check Existing Tasks Error]', err);
    }
}
