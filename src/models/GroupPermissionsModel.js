import { getDB } from '../services/db.js';

export async function initGroupPermissionsTable() {
    const db = await getDB();
    await db.exec(`
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
}

export async function requestGroupAccess(groupId, groupName, requestedBy) {
    const db = await getDB();
    try {
        await db.run(
            `INSERT INTO group_permissions (group_id, group_name, requested_by, allowed)
             VALUES (?, ?, ?, 0)
             ON CONFLICT(group_id) DO UPDATE SET
             group_name = excluded.group_name,
             requested_by = excluded.requested_by`,
            [groupId, groupName, requestedBy]
        );
        return true;
    } catch (error) {
        console.error('[GroupPermissions] Error requesting access:', error);
        return false;
    }
}

export async function allowGroupAccess(groupId) {
    const db = await getDB();
    try {
        await db.run(
            `UPDATE group_permissions SET allowed = 1, allowed_at = CURRENT_TIMESTAMP
             WHERE group_id = ?`,
            [groupId]
        );
        return true;
    } catch (error) {
        console.error('[GroupPermissions] Error allowing access:', error);
        return false;
    }
}

export async function denyGroupAccess(groupId) {
    const db = await getDB();
    try {
        await db.run(
            `UPDATE group_permissions SET allowed = 0 WHERE group_id = ?`,
            [groupId]
        );
        return true;
    } catch (error) {
        console.error('[GroupPermissions] Error denying access:', error);
        return false;
    }
}

export async function isGroupAllowed(groupId) {
    const db = await getDB();
    try {
        const row = await db.get(
            `SELECT allowed FROM group_permissions WHERE group_id = ?`,
            [groupId]
        );
        return row?.allowed === 1;
    } catch (error) {
        console.error('[GroupPermissions] Error checking access:', error);
        return false;
    }
}

export async function getPendingGroupRequests() {
    const db = await getDB();
    try {
        return await db.all(
            `SELECT * FROM group_permissions WHERE allowed = 0 ORDER BY requested_at DESC`
        );
    } catch (error) {
        console.error('[GroupPermissions] Error getting pending requests:', error);
        return [];
    }
}

export async function getGroupInfo(groupId) {
    const db = await getDB();
    try {
        return await db.get(
            `SELECT * FROM group_permissions WHERE group_id = ?`,
            [groupId]
        );
    } catch (error) {
        console.error('[GroupPermissions] Error getting group info:', error);
        return null;
    }
}
