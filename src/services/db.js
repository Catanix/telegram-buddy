import { getDatabase } from './database/index.js';

function getDb() {
    const db = getDatabase();
    if (!db) {
        console.error('[DB] Database not initialized');
        return null;
    }
    return db;
}

// 📊 Увеличение счётчика статистики
export async function incrementStats(userId, service) {
    const db = getDb();
    if (!db) return;

    const columnMap = {
        'tiktok': 'downloads_tiktok',
        'instagram': 'downloads_instagram',
        'youtube': 'downloads_youtube',
        'x': 'downloads_x'
    };
    
    const column = columnMap[service] || 'downloads';

    try {
        await db.run(`
            INSERT INTO user_stats (user_id, ${column}, last_active)
            VALUES (?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
            ${column} = ${column} + 1,
            last_active = CURRENT_TIMESTAMP
        `, [userId]);
    } catch (error) {
        console.error(`[DB] Failed to increment stats for service ${service}:`, error);
    }
}

// 📈 Получение статистики пользователя
export async function getStats(userId) {
    const db = getDb();
    if (!db) return [];

    try {
        const row = await db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId]);
        if (!row) return [];

        const result = [];
        if (row.downloads_tiktok > 0) result.push({ service: 'tiktok', usage_count: row.downloads_tiktok });
        if (row.downloads_instagram > 0) result.push({ service: 'instagram', usage_count: row.downloads_instagram });
        if (row.downloads_youtube > 0) result.push({ service: 'youtube', usage_count: row.downloads_youtube });
        if (row.downloads_x > 0) result.push({ service: 'x', usage_count: row.downloads_x });
        if (row.downloads > 0) result.push({ service: 'music', usage_count: row.downloads });

        return result;
    } catch (error) {
        console.error(`[DB] Failed to get stats for user ${userId}:`, error);
        return [];
    }
}

// 💬 Сохранение сообщения группы (backward compat)
export async function saveGroupMessage(groupId, messageId, userId, username, firstName, text) {
    const db = getDb();
    if (!db) return;
    
    try {
        await db.run(
            `INSERT INTO group_messages (group_id, message_id, user_id, username, first_name, text)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(group_id, message_id) DO NOTHING`,
            [String(groupId), messageId, userId, username || null, firstName || null, text]
        );
    } catch (error) {
        console.error('[DB] Failed to save group message:', error);
    }
}

// 📜 Получение истории сообщений группы
export async function getGroupMessageHistory(groupId, limit = 100) {
    const db = getDb();
    if (!db) return [];
    
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

// 🧹 Очистка старых сообщений
export async function cleanupOldMessages() {
    const db = getDb();
    if (!db) return;
    
    try {
        await db.run(
            `DELETE FROM group_messages WHERE created_at < datetime('now', '-7 days')`
        );
        console.log('[DB] Old messages cleaned up');
    } catch (error) {
        console.error('[DB] Failed to cleanup old messages:', error);
    }
}

// Получение объекта БД (backward compat)
export async function getDB() {
    return getDb();
}

// Инициализация (backward compat, no-op since database/index.js handles it)
export async function initDB() {
    console.log('[DB] initDB called (noop, using database/index.js)');
}
