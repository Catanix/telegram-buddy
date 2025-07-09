import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

export let db;

export async function initDB() {
    const dbPath = path.resolve('./data/db/tasks.sqlite');
    const dbDir = path.dirname(dbPath);

    try {
        // ✅ Создаём директорию для базы данных, если не существует
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            console.log(`📁 Created DB directory: ${dbDir}`);
        }

        // ✅ Открываем базу данных
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

        // ✅ Создаём таблицу tasks, если её нет
        await db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id INTEGER,
                text TEXT,
                remind_at TEXT,
                created_at TEXT,
                notified INTEGER DEFAULT 0
            );
        `);

        // ✅ Создаём таблицу user_stats для статистики
        await db.exec(`
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id INTEGER NOT NULL,
                service TEXT NOT NULL,
                usage_count INTEGER DEFAULT 1,
                PRIMARY KEY (user_id, service)
            );
        `);

        // ✅ Миграция устаревших дат (опционально)
        await migrateTaskDates();

    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
}

/**
 * Миграция устаревших дат, если они не в ISO
 */
async function migrateTaskDates() {
    try {
        console.log('🔄 Checking for tasks with non-ISO date format...');

        const tasks = await db.all('SELECT id, remind_at FROM tasks');
        let migratedCount = 0;

        for (const task of tasks) {
            const isValidISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(task.remind_at);
            if (!isValidISO) {
                const parsed = new Date(task.remind_at);
                if (!isNaN(parsed.getTime())) {
                    const iso = parsed.toISOString();
                    await db.run('UPDATE tasks SET remind_at = ? WHERE id = ?', [iso, task.id]);
                    console.log(`✅ Migrated task ${task.id}: "${task.remind_at}" → "${iso}"`);
                    migratedCount++;
                } else {
                    console.warn(`⚠️ Skipped task ${task.id}: could not parse "${task.remind_at}"`);
                }
            }
        }

        console.log(migratedCount > 0
            ? `✅ Migrated ${migratedCount} tasks to ISO format.`
            : '✅ No tasks needed migration.');

    } catch (error) {
        console.error('❌ Error during date migration:', error);
    }
}

// ➕ Добавление задачи
export async function addTask(chatId, text, remindAt) {
    const result = await db.run(
        'INSERT INTO tasks (chat_id, text, remind_at, created_at) VALUES (?, ?, ?, ?)',
        [chatId, text, remindAt, new Date().toISOString()]
    );
    return result.lastID;
}

// 🔄 Получение задач для напоминания
export async function getTasksToRemind() {
    const now = new Date().toISOString();
    return db.all(
        'SELECT * FROM tasks WHERE remind_at <= ? AND notified = 0',
        [now]
    );
}

// ✅ Отметка задачи как выполненной
export async function markTaskAsNotified(id) {
    await db.run(
        'UPDATE tasks SET notified = 1 WHERE id = ?',
        [id]
    );
}

// 🗑️ Удал��ние задачи
export async function deleteTask(id) {
    await db.run(
        'DELETE FROM tasks WHERE id = ?',
        [id]
    );
}

// 📊 Увеличение счётчика статистики
export async function incrementStats(userId, service) {
    try {
        await db.run(`
            INSERT INTO user_stats (user_id, service, usage_count)
            VALUES (?, ?, 1)
            ON CONFLICT(user_id, service) DO UPDATE SET
            usage_count = usage_count + 1;
        `, [userId, service]);
    } catch (error) {
        console.error(`❌ Failed to increment stats for service ${service}:`, error);
    }
}

// 📈 Получение статистики пользователя
export async function getStats(userId) {
    try {
        return await db.all('SELECT service, usage_count FROM user_stats WHERE user_id = ?', [userId]);
    } catch (error) {
        console.error(`❌ Failed to get stats for user ${userId}:`, error);
        return [];
    }
}
