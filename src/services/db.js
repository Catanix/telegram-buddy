import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { convertToISODate } from '../utils/dateParser.js';

export let db;

export async function initDB() {
    db = await open({
        filename: './tasks.sqlite',
        driver: sqlite3.Database
    });

    // Создание таблицы, если не существует
    await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER,
      text TEXT,
      remind_at TEXT,
      created_at TEXT
    );
  `);

    const columns = await db.all(`PRAGMA table_info(tasks);`);
    const hasNotified = columns.some(col => col.name === 'notified');

    if (!hasNotified) {
        await db.exec('ALTER TABLE tasks ADD COLUMN notified INTEGER DEFAULT 0;');
    }

    // Migrate existing tasks with human-readable dates to ISO format
    await migrateTaskDates();
}

/**
 * Migrate existing tasks with human-readable dates to ISO format
 */
async function migrateTaskDates() {
    try {
        console.log('🔄 Checking for tasks with non-ISO date format...');

        // Get all tasks
        const tasks = await db.all('SELECT id, remind_at FROM tasks');
        let migratedCount = 0;

        for (const task of tasks) {
            // Check if the date is already in ISO format
            const isIsoDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(task.remind_at);

            if (!isIsoDate) {
                const isoDate = convertToISODate(task.remind_at);

                if (isoDate) {
                    await db.run(
                        'UPDATE tasks SET remind_at = ? WHERE id = ?',
                        [isoDate, task.id]
                    );
                    console.log(`✅ Migrated task ${task.id}: "${task.remind_at}" -> "${isoDate}"`);
                    migratedCount++;
                } else {
                    console.error(`❌ Failed to migrate task ${task.id} with date: ${task.remind_at}`);
                }
            }
        }

        if (migratedCount > 0) {
            console.log(`🔄 Migrated ${migratedCount} tasks to ISO date format`);
        } else {
            console.log('✅ No tasks needed migration to ISO date format');
        }
    } catch (error) {
        console.error('❌ Error migrating task dates:', error);
    }
}
