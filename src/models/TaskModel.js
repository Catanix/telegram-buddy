import { db } from '../services/db.js';
import { isValidDate } from '../utils/dateUtils.js';

/**
 * Вставка новой задачи
 */
export async function insertTask(chatId, text, remindAt) {
    const date = new Date(remindAt);
    if (!isValidDate(date)) throw new Error(`Invalid date format: ${remindAt}`);
    return db.run(
        'INSERT INTO tasks (chat_id, text, remind_at, created_at, notified) VALUES (?, ?, ?, ?, ?)',
        [chatId, text, date.toISOString(), new Date().toISOString(), 0]
    );
}

/**
 * Получение всех ожидающих задач
 */
export async function getPendingTasks() {
    const nowISO = new Date().toISOString();
    const tasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at > ? AND notified = 0',
        [nowISO]
    );
    console.log(`[TaskModel] Найдено ${tasks.length} ожидающих задач`);
    return tasks;
}

/**
 * Получение задач, срок которых наступил в текущую минуту
 */
export async function getCurrentMinuteTasks() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const startOfMinute = new Date(currentYear, currentMonth, currentDay, currentHour, currentMinute, 0, 0);
    const endOfMinute = new Date(currentYear, currentMonth, currentDay, currentHour, currentMinute, 59, 999);

    const startISO = startOfMinute.toISOString();
    const endISO = endOfMinute.toISOString();

    const tasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at >= ? AND remind_at <= ? AND notified = 0',
        [startISO, endISO]
    );

    console.log(`[TaskModel] Найдено ${tasks.length} задач на текущую минуту`);
    return tasks;
}

/**
 * Получает список просроченных задач
 */
export async function getOverdueTasks() {
    const nowISO = new Date().toISOString();

    const overdueTasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at < ? AND notified = 0',
        [nowISO]
    );

    console.log(`[TaskModel] Найдено ${overdueTasks.length} просроченных задач`);
    return overdueTasks;
}

/**
 * Помечает задачу как уведомлённую
 */
export async function markTaskAsNotified(taskId) {
    const result = await db.run(
        'UPDATE tasks SET notified = 1 WHERE id = ?',
        [taskId]
    );

    if (result.changes === 0) {
        console.log(`[TaskModel] Задача ${taskId} не найдена или уже уведомлена`);
    }

    return result;
}

/**
 * Удаление задачи
 */
export async function deleteTask(taskId) {
    const result = await db.run(
        'DELETE FROM tasks WHERE id = ?',
        [taskId]
    );

    if (result.changes === 0) {
        console.log(`[TaskModel] Задача ${taskId} не найдена`);
    }

    return result;
}

/**
 * Удаляет уведомлённые задачи, срок которых прошёл
 */
export async function cleanupOldTasks() {
    const nowISO = new Date().toISOString();

    const tasksToDelete = await db.all(
        'SELECT * FROM tasks WHERE remind_at <= ? AND notified = 1',
        [nowISO]
    );

    if (tasksToDelete.length > 0) {
        const result = await db.run(
            'DELETE FROM tasks WHERE remind_at <= ? AND notified = 1',
            [nowISO]
        );
        console.log(`[TaskModel] Удалено ${result.changes} старых задач`);
        return result;
    }

    return { changes: 0 };
}

/**
 * Возвращает дату ближайшей ожидающей задачи
 */
export async function getNextTaskTime() {
    const nowISO = new Date().toISOString();
    const row = await db.get(
        'SELECT remind_at FROM tasks WHERE remind_at > ? AND notified = 0 ORDER BY remind_at ASC LIMIT 1',
        [nowISO]
    );
    return row?.remind_at ? new Date(row.remind_at) : null;
}
