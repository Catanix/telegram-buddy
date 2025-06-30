import { db } from '../services/db.js';
import { isValidDate } from "../utils/dateUtils.js";

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
    console.log(`[TaskModel] Поиск задач для текущей минуты. Локальное время: ${now.toISOString()}`);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // ✅ Используем UTC, чтобы избежать смещения
    const startOfMinute = new Date(Date.UTC(currentYear, currentMonth, currentDay, currentHour, currentMinute, 0, 0));
    const endOfMinute = new Date(Date.UTC(currentYear, currentMonth, currentDay, currentHour, currentMinute, 59, 999));

    const startISO = startOfMinute.toISOString();
    const endISO = endOfMinute.toISOString();

    const allTasks = await db.all('SELECT * FROM tasks WHERE notified = 0');

    let tasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at >= ? AND remind_at <= ? AND notified = 0',
        [startISO, endISO]
    );

    // Обход возможных ошибок часового пояса
    if (tasks.length === 0 && allTasks.length > 0) {
        const tasksToCheck = [];

        for (const task of allTasks) {
            const taskDate = new Date(task.remind_at);

            if (
                taskDate.getFullYear() === currentYear &&
                taskDate.getMonth() === currentMonth &&
                taskDate.getDate() === currentDay &&
                taskDate.getMinutes() === currentMinute
            ) {
                const hourDiff = Math.abs(taskDate.getHours() - currentHour);
                if (hourDiff <= 2) {
                    console.log(`[TaskModel] Подозрение на смещение по времени у задачи ${task.id}`);
                    tasksToCheck.push(task);
                }
            }
        }

        if (tasksToCheck.length > 0) {
            console.log(`[TaskModel] Найдено ${tasksToCheck.length} задач с возможным смещением времени`);
            tasks = tasksToCheck;
        }
    }

    console.log(`[TaskModel] Найдено ${tasks.length} задач на текущую минуту`);
    return tasks;
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
 * Получает список просроченных задач
 */
export async function getOverdueTasks() {
    const now = new Date();
    console.log(`[TaskModel] Поиск просроченных задач. Локальное время: ${now.toISOString()}`);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // ✅ UTC
    const startOfMinute = new Date(Date.UTC(currentYear, currentMonth, currentDay, currentHour, currentMinute, 0, 0));
    const startISO = startOfMinute.toISOString();

    const allTasks = await db.all('SELECT * FROM tasks WHERE notified = 0');

    let overdueTasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at < ? AND notified = 0',
        [startISO]
    );

    if (overdueTasks.length === 0 && allTasks.length > 0) {
        const tasksToCheck = [];

        for (const task of allTasks) {
            const taskDate = new Date(task.remind_at);

            if (
                taskDate.getFullYear() === currentYear &&
                taskDate.getMonth() === currentMonth &&
                taskDate.getDate() === currentDay
            ) {
                const hourDiff = taskDate.getHours() - currentHour;
                if (hourDiff > 0 && hourDiff <= 2) {
                    console.log(`[TaskModel] Подозрение на смещение времени у задачи ${task.id}`);
                    tasksToCheck.push(task);
                }
            }
        }

        if (tasksToCheck.length > 0) {
            console.log(`[TaskModel] Найдено ${tasksToCheck.length} задач с возможным смещением`);
            overdueTasks = tasksToCheck;
        }
    }

    console.log(`[TaskModel] Найдено ${overdueTasks.length} просроченных задач`);
    return overdueTasks;
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
