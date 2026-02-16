import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { CONFIG } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

let dbInstance = null;

/**
 * Initialize database connection
 * @returns {Promise<Database>}
 */
export async function initDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    try {
        dbInstance = await open({
            filename: CONFIG.dbPath,
            driver: sqlite3.Database
        });

        // Enable foreign keys
        await dbInstance.exec('PRAGMA foreign_keys = ON');
        
        // Create tables
        await createTables();
        
        logger.info('Database connected');
        return dbInstance;
    } catch (error) {
        logger.error('Failed to connect to database:', error);
        throw error;
    }
}

/**
 * Create database tables
 */
async function createTables() {
    // Group permissions table
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS group_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id TEXT UNIQUE NOT NULL,
            group_name TEXT,
            allowed BOOLEAN DEFAULT 0,
            requested_by TEXT,
            requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            allowed_at DATETIME
        )
    `);

    // Group messages table
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS group_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_id TEXT NOT NULL,
            message_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            username TEXT,
            first_name TEXT,
            text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(group_id, message_id)
        )
    `);

    // User stats table
    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS user_stats (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            downloads INTEGER DEFAULT 0,
            downloads_tiktok INTEGER DEFAULT 0,
            downloads_instagram INTEGER DEFAULT 0,
            downloads_youtube INTEGER DEFAULT 0,
            downloads_x INTEGER DEFAULT 0,
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

/**
 * Get database instance
 * @returns {Database|null}
 */
export function getDatabase() {
    return dbInstance;
}

/**
 * Save group message
 * @param {string|number} groupId 
 * @param {number} messageId 
 * @param {number} userId 
 * @param {string} username 
 * @param {string} firstName 
 * @param {string} text 
 */
export async function saveGroupMessage(groupId, messageId, userId, username, firstName, text) {
    if (!dbInstance) {
        throw new Error('Database not initialized');
    }

    await dbInstance.run(
        `INSERT INTO group_messages (group_id, message_id, user_id, username, first_name, text)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(group_id, message_id) DO NOTHING`,
        [String(groupId), messageId, userId, username || null, firstName || null, text]
    );

    // Clean old messages if exceeding limit
    await dbInstance.run(
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
}

/**
 * Get recent messages from group
 * @param {string|number} groupId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getRecentMessages(groupId, limit = 100) {
    if (!dbInstance) {
        throw new Error('Database not initialized');
    }

    return dbInstance.all(
        `SELECT * FROM group_messages 
         WHERE group_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [String(groupId), limit]
    );
}
