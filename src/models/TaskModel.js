import { db } from '../services/db.js';
import {isValidDate} from "../utils/dateUtils.js";

export async function insertTask(chatId, text, remindAt) {
    const date = new Date(remindAt);
    if (!isValidDate(date)) throw new Error(`Invalid date format: ${remindAt}`);
    return db.run(
        'INSERT INTO tasks (chat_id, text, remind_at, created_at, notified) VALUES (?, ?, ?, ?, ?)',
        [chatId, text, date.toISOString(), new Date().toISOString(), 0]
    );
}

export async function getPendingTasks() {
    const now = new Date();
    const nowISO = now.toISOString();

    const tasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at > ? AND notified = 0',
        [nowISO]
    );

    console.log(`[TaskModel] Найдено ${tasks.length} ожидающих задач`);
    return tasks;
}

/**
 * Получает список задач, срок которых наступил в текущую минуту
 */
export async function getCurrentMinuteTasks() {
    const now = new Date();
    console.log(`[TaskModel] Поиск задач для текущей минуты. Текущее время: ${now.toISOString()}`);

    // Extract year, month, day, hour, minute from the current date using UTC time
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const startOfMinute = new Date(currentYear, currentMonth, currentDay, currentHour, currentMinute, 0, 0);
    const endOfMinute = new Date(currentYear, currentMonth, currentDay, currentHour, currentMinute, 59, 999);


    const startISO = startOfMinute.toISOString();
    const endISO = endOfMinute.toISOString();

    // Get all unnotified tasks
    const allTasks = await db.all('SELECT * FROM tasks WHERE notified = 0');

    // Get tasks that are scheduled for the current minute
    let tasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at >= ? AND remind_at <= ? AND notified = 0',
        [startISO, endISO]
    );

    // If no tasks found in the current minute, check if there are any tasks with explicit UTC times
    // that might have been incorrectly calculated by DeepSeek
    if (tasks.length === 0 && allTasks.length > 0) {
        const tasksToCheck = [];

        for (const task of allTasks) {
            const taskDate = new Date(task.remind_at);
            const taskMinute = taskDate.getUTCMinutes();
            const taskHour = taskDate.getUTCHours();

            // Check if the task is scheduled for the current minute but in a different hour
            if (taskMinute === currentMinute &&
                taskDate.getUTCFullYear() === currentYear &&
                taskDate.getUTCMonth() === currentMonth &&
                taskDate.getUTCDate() === currentDay) {

                const hourDiff = Math.abs(taskHour - currentHour);

                // If the hour difference is small, it might be due to a timezone calculation error
                if (hourDiff <= 2) {
                    console.log(`[TaskModel] Найдена задача с возможной ошибкой часового пояса: ${task.id}`);
                    tasksToCheck.push(task);
                }
            }
        }

        if (tasksToCheck.length > 0) {
            console.log(`[TaskModel] Найдено ${tasksToCheck.length} задач с возможной ошибкой часового пояса`);
            tasks = tasksToCheck;
        }
    }

    console.log(`[TaskModel] Найдено ${tasks.length} задач для выполнения в текущую минуту`);
    return tasks;
}

export async function markTaskAsNotified(taskId) {
    const result = await db.run(
        'UPDATE tasks SET notified = 1 WHERE id = ?',
        [taskId]
    );

    if (result.changes === 0) {
        console.log(`[TaskModel] Задача ${taskId} не найдена или уже помечена как уведомленная`);
    }

    return result;
}

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
    console.log(`[TaskModel] Поиск просроченных задач. Текущее время: ${now.toISOString()}`);

    // Extract year, month, day, hour, minute from the current date using UTC time
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();
    const currentDay = now.getUTCDate();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Create date object for the start of the current minute in UTC
    const startOfMinute = new Date(Date.UTC(currentYear, currentMonth, currentDay, currentHour, currentMinute, 0, 0));
    const startISO = startOfMinute.toISOString();

    // Get all unnotified tasks to check for timezone issues
    const allTasks = await db.all('SELECT * FROM tasks WHERE notified = 0');

    // Get tasks that are in the past but not in the current minute
    let overdueTasks = await db.all(
        'SELECT * FROM tasks WHERE remind_at < ? AND notified = 0',
        [startISO]
    );

    // If no overdue tasks found, check if there are any tasks with explicit UTC times
    // that might have been incorrectly calculated by DeepSeek
    if (overdueTasks.length === 0 && allTasks.length > 0) {
        const tasksToCheck = [];

        for (const task of allTasks) {
            const taskDate = new Date(task.remind_at);

            // Check if the task is scheduled for today but in a future hour
            if (taskDate.getUTCFullYear() === currentYear &&
                taskDate.getUTCMonth() === currentMonth &&
                taskDate.getUTCDate() === currentDay) {

                const hourDiff = taskDate.getUTCHours() - currentHour;

                // If the task is 1-2 hours in the future, it might be due to a timezone calculation error
                if (hourDiff > 0 && hourDiff <= 2) {
                    console.log(`[TaskModel] Найдена задача с возможной ошибкой часового пояса: ${task.id}`);
                    tasksToCheck.push(task);
                }
            }
        }

        if (tasksToCheck.length > 0) {
            console.log(`[TaskModel] Найдено ${tasksToCheck.length} задач с возможной ошибкой часового пояса`);
            overdueTasks = tasksToCheck;
        }
    }

    console.log(`[TaskModel] Найдено ${overdueTasks.length} просроченных задач`);
    return overdueTasks;
}

/**
 * Очищает старые задачи, которые уже были уведомлены
 */
export async function cleanupOldTasks() {
    const now = new Date();
    const nowISO = now.toISOString();

    // Получаем список задач, которые будут удалены
    const tasksToDelete = await db.all(
        'SELECT * FROM tasks WHERE remind_at <= ? AND notified = 1',
        [nowISO]
    );

    if (tasksToDelete.length > 0) {
        // Удаляем задачи
        const result = await db.run(
            'DELETE FROM tasks WHERE remind_at <= ? AND notified = 1',
            [nowISO]
        );

        console.log(`[TaskModel] Удалено ${result.changes} старых задач`);
        return result;
    } else {
        return { changes: 0 };
    }
}
