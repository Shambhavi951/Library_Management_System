import { query } from '../database/db.js';

export async function notify(memberId, type, title, message, branchId = null) {
  if (!memberId && !branchId) return null;
  const rows = await query(
    `INSERT INTO notifications(member_id, notification_type, title, message_body, read_status, created_date, branch_id)
     OUTPUT INSERTED.*
     VALUES(@memberId,@type,@title,@message,'N',GETDATE(),@branchId)`,
    { memberId, type, title, message, branchId }
  );
  return rows[0];
}

export async function listNotifications(memberId) {
  return query('SELECT * FROM notifications WHERE member_id = @memberId ORDER BY created_date DESC', { memberId });
}

export async function listAdminNotifications(branchId) {
  return query(
    `SELECT * FROM notifications 
     WHERE branch_id = @branchId 
     ORDER BY created_date DESC`,
    { branchId }
  );
}

export async function listOwnerNotifications() {
  return query(
    `SELECT * FROM notifications 
     WHERE member_id IS NULL AND branch_id IS NULL 
     ORDER BY created_date DESC`
  );
}

export async function markRead(memberId, notificationId) {
  return query(
    `UPDATE notifications SET read_status = 'Y'
     OUTPUT INSERTED.*
     WHERE notification_id = @notificationId AND member_id = @memberId`,
    { memberId, notificationId }
  );
}

