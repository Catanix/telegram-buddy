import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { convertToISODate } from '../utils/dateParser.js';
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
                created_at TEXT
            );
        `);

        // ✅ Проверка и добавление колонки notified, если её нет
        const columns = await db.all(`PRAGMA table_info(tasks);`);
        const hasNotified = columns.some(col => col.name === 'notified');
        if (!hasNotified) {
            await db.exec('ALTER TABLE tasks ADD COLUMN notified INTEGER DEFAULT 0;');
        }

        // ✅ Миграция дат в ISO
        await migrateTaskDates();

    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
}

/**
 * Migrate existing tasks with human-readable dates to ISO format
 */
async function migrateTaskDates() {
    try {
        console.log('🔄 Checking for tasks with non-ISO date format...');

        const tasks = await db.all('SELECT id, remind_at FROM tasks');
        let migratedCount = 0;

        for (const task of tasks) {
            const isIsoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(task.remind_at);
            if (!isIsoDate) {
                const isoDate = convertToISODate(task.remind_at);
                if (isoDate) {
                    await db.run(
                        'UPDATE tasks SET remind_at = ? WHERE id = ?',
                        [isoDate, task.id]
                    );
                    console.log(`✅ Migrated task ${task.id}: "${task.remind_at}" → "${isoDate}"`);
                    migratedCount++;
                } else {
                    console.warn(`⚠️ Could not convert task ${task.id}: "${task.remind_at}"`);
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
