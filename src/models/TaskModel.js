import { db } from '../services/db.js';
import { convertToISODate } from '../utils/dateParser.js';

export async function insertTask(chatId, text, remindAt) {
    // Convert human-readable date to ISO format
    const isoDate = convertToISODate(remindAt);

    if (!isoDate) {
        console.error(`Failed to parse date: ${remindAt}`);
        throw new Error(`Invalid date format: ${remindAt}`);
    }

    console.log(`Converting date: "${remindAt}" to ISO: "${isoDate}"`);

    return db.run(
        'INSERT INTO tasks (chat_id, text, remind_at, created_at, notified) VALUES (?, ?, ?, ?, ?)',
        [chatId, text, isoDate, new Date().toISOString(), 0]
    );
}

export async function getPendingTasks() {
    const now = new Date().toISOString();
    console.log(`[TaskModel] Поиск ожидающих задач. Текущее время: ${now}`);

    const tasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at > ? AND notified = 0',
        [now]
    );

    if (tasks.length > 0) {
        console.log(`[TaskModel] Найдено ${tasks.length} ожидающих задач:`);
        tasks.forEach(task => {
            console.log(`[TaskModel] - Задача ${task.id}: "${task.text}" (срок: ${task.remind_at})`);
        });
    } else {
        console.log('[TaskModel] Ожидающих задач не найдено');
    }

    return tasks;
}

export async function getOverdueTasks() {
    const now = new Date().toISOString();
    console.log(`[TaskModel] Поиск просроченных задач. Текущее время: ${now}`);

    const tasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at <= ? AND notified = 0',
        [now]
    );

    if (tasks.length > 0) {
        console.log(`[TaskModel] Найдено ${tasks.length} просроченных задач:`);
        tasks.forEach(task => {
            console.log(`[TaskModel] - Задача ${task.id}: "${task.text}" (срок: ${task.remind_at})`);
        });
    } else {
        console.log('[TaskModel] Просроченных задач не найдено');
    }

    return tasks;
}

export async function markTaskAsNotified(taskId) {
    console.log(`[TaskModel] Пометка задачи ${taskId} как уведомленной`);

    const result = await db.run(
        'UPDATE tasks SET notified = 1 WHERE id = ?',
        [taskId]
    );

    if (result.changes > 0) {
        console.log(`[TaskModel] Задача ${taskId} успешно помечена как уведомленная`);
    } else {
        console.log(`[TaskModel] Задача ${taskId} не найдена или уже помечена как уведомленная`);
    }

    return result;
}

export async function deleteTask(taskId) {
    console.log(`[TaskModel] Удаление задачи ${taskId}`);

    const result = await db.run(
        'DELETE FROM tasks WHERE id = ?',
        [taskId]
    );

    if (result.changes > 0) {
        console.log(`[TaskModel] Задача ${taskId} успешно удалена`);
    } else {
        console.log(`[TaskModel] Задача ${taskId} не найдена`);
    }

    return result;
}

export async function cleanupOldTasks() {
    const now = new Date().toISOString();
    console.log(`[TaskModel] Очистка старых задач. Текущее время: ${now}`);

    // Сначала получим список задач, которые будут удалены (для логирования)
    const tasksToDelete = await db.all(
        'SELECT * FROM tasks WHERE (remind_at <= ? AND notified = 1)',
        [now]
    );

    if (tasksToDelete.length > 0) {
        console.log(`[TaskModel] Будет удалено ${tasksToDelete.length} старых задач:`);
        tasksToDelete.forEach(task => {
            console.log(`[TaskModel] - Задача ${task.id}: "${task.text}" (срок: ${task.remind_at})`);
        });

        // Теперь удаляем задачи
        const result = await db.run(
            'DELETE FROM tasks WHERE (remind_at <= ? AND notified = 1)',
            [now]
        );

        console.log(`[TaskModel] Удалено ${result.changes} старых задач`);
        return result;
    } else {
        console.log('[TaskModel] Нет старых задач для удаления');
        return { changes: 0 };
    }
}
