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

        // ✅ Создаём таблицу user_stats для статистики
        await db.exec(`
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id INTEGER NOT NULL,
                service TEXT NOT NULL,
                usage_count INTEGER DEFAULT 1,
                PRIMARY KEY (user_id, service)
            );
        `);

        // ✅ Создаём таблицу group_permissions для управления доступом к группам
        await db.exec(`
            CREATE TABLE IF NOT EXISTS group_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id TEXT UNIQUE NOT NULL,
                group_name TEXT,
                allowed BOOLEAN DEFAULT 0,
                requested_by TEXT,
                requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                allowed_at DATETIME
            );
        `);

        // ✅ Создаём таблицу для истории сообщений групп
        await db.exec(`
            CREATE TABLE IF NOT EXISTS group_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id TEXT NOT NULL,
                message_id INTEGER NOT NULL,
                user_id INTEGER,
                username TEXT,
                first_name TEXT,
                text TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('✅ Database initialized successfully');
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

// 💬 Сохранение сообщения группы (храним только последние 100)
export async function saveGroupMessage(groupId, messageId, userId, username, firstName, text) {
    try {
        await db.run(
            `INSERT INTO group_messages (group_id, message_id, user_id, username, first_name, text)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [String(groupId), messageId, userId, username, firstName, text]
        );
        
        // Удаляем старые сообщения, оставляем только последние 100 для этой группы
        await db.run(
            `DELETE FROM group_messages 
             WHERE group_id = ? 
             AND id NOT IN (
                 SELECT id FROM group_messages 
                 WHERE group_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 100
             )`,
            [String(groupId), String(groupId)]
        );
    } catch (error) {
        console.error('[DB] Failed to save group message:', error);
    }
}

// 📜 Получение истории сообщений группы
export async function getGroupMessageHistory(groupId, limit = 100) {
    try {
        return await db.all(
            `SELECT username, first_name, text, created_at 
             FROM group_messages 
             WHERE group_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [String(groupId), limit]
        );
    } catch (error) {
        console.error('[DB] Failed to get group message history:', error);
        return [];
    }
}

// 🧹 Очистка старых сообщений (старше 7 дней)
export async function cleanupOldMessages() {
    try {
        await db.run(
            `DELETE FROM group_messages WHERE created_at < datetime('now', '-7 days')`
        );
        console.log('[DB] Old messages cleaned up');
    } catch (error) {
        console.error('[DB] Failed to cleanup old messages:', error);
    }
}

// Получение объекта БД для других модулей
export async function getDB() {
    return db;
}
