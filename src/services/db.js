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
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
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
