import { getDatabase } from './index.js';
import { logger } from '../../utils/logger.js';
import { CONFIG } from '../../config/index.js';

/**
 * Save group message to database
 * @param {string|number} groupId 
 * @param {number} messageId 
 * @param {number} userId 
 * @param {string} username 
 * @param {string} firstName 
 * @param {string} text 
 */
export async function saveGroupMessage(groupId, messageId, userId, username, firstName, text) {
    const db = getDatabase();
    if (!db) {
        throw new Error('Database not initialized');
    }

    await db.run(
        `INSERT INTO group_messages (group_id, message_id, user_id, username, first_name, text)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, message_id) DO NOTHING`,
        [String(groupId), messageId, userId, username || null, firstName || null, text]
    );

    // Clean old messages if exceeding limit
    await db.run(
        `DELETE FROM group_messages 
         WHERE group_id = ? 
         AND id NOT IN (
             SELECT id FROM group_messages 
             WHERE group_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?
         )`,
        [String(groupId), String(groupId), CONFIG.messageHistoryLimit]
    );
    
    logger.debug(`Saved message from group ${groupId}`);
}

/**
 * Get recent messages from group
 * @param {string|number} groupId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getRecentMessages(groupId, limit = 100) {
    const db = getDatabase();
    if (!db) {
        throw new Error('Database not initialized');
    }

    return db.all(
        `SELECT * FROM group_messages 
         WHERE group_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [String(groupId), limit]
    );
}
