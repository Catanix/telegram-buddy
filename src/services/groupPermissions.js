import { getDatabase, initDatabase } from './database/index.js';
import { logger } from '../utils/logger.js';

/**
 * Request access for a new group
 * @param {string} groupId 
 * @param {string} groupName 
 * @param {string} requestedBy 
 * @returns {Promise<boolean>}
 */
export async function requestGroupAccess(groupId, groupName, requestedBy) {
    const db = getDatabase() || await initDatabase();
    
    try {
        await db.run(
            `INSERT INTO group_permissions (group_id, group_name, requested_by, allowed)
             VALUES (?, ?, ?, 0)
             ON CONFLICT(group_id) DO UPDATE SET
             group_name = excluded.group_name,
             requested_by = excluded.requested_by`,
            [groupId, groupName || 'Unknown', requestedBy || 'unknown']
        );
        logger.info(`Group access requested: ${groupName} (${groupId})`);
        return true;
    } catch (error) {
        logger.error('Failed to request group access:', error);
        return false;
    }
}

/**
 * Check if group is allowed
 * @param {string} groupId 
 * @returns {Promise<boolean>}
 */
export async function isGroupAllowed(groupId) {
    const db = getDatabase() || await initDatabase();
    
    try {
        const row = await db.get(
            `SELECT allowed FROM group_permissions WHERE group_id = ?`,
            [groupId]
        );
        const isAllowed = row?.allowed == 1;  // Use == to handle both number 1 and string "1"
        logger.info(`Checking group ${groupId}: allowed=${isAllowed} (row=${JSON.stringify(row)})`);
        return isAllowed;
    } catch (error) {
        logger.error('Failed to check group permission:', error);
        return false;
    }
}

/**
 * Allow group access
 * @param {string} groupId 
 * @returns {Promise<boolean>}
 */
export async function allowGroupAccess(groupId) {
    const db = getDatabase() || await initDatabase();
    
    try {
        await db.run(
            `UPDATE group_permissions 
             SET allowed = 1, allowed_at = CURRENT_TIMESTAMP
             WHERE group_id = ?`,
            [groupId]
        );
        logger.info(`Group allowed: ${groupId}`);
        return true;
    } catch (error) {
        logger.error('Failed to allow group:', error);
        return false;
    }
}

/**
 * Deny/revoke group access
 * @param {string} groupId 
 * @returns {Promise<boolean>}
 */
export async function denyGroupAccess(groupId) {
    const db = getDatabase() || await initDatabase();
    
    try {
        await db.run(
            `UPDATE group_permissions SET allowed = 0 WHERE group_id = ?`,
            [groupId]
        );
        logger.info(`Group denied: ${groupId}`);
        return true;
    } catch (error) {
        logger.error('Failed to deny group:', error);
        return false;
    }
}

/**
 * Get pending group requests
 * @returns {Promise<Array>}
 */
export async function getPendingRequests() {
    const db = getDatabase() || await initDatabase();
    
    return db.all(
        `SELECT * FROM group_permissions 
         WHERE allowed = 0 
         ORDER BY requested_at DESC`
    );
}
