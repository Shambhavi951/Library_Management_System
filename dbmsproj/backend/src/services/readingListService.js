import { query } from '../database/db.js';
import { badRequest } from '../utils/errors.js';

export async function createList(memberId, payload) {
  const [limits] = await query(
    `SELECT mp.reading_list_limit,
            (SELECT COUNT(*) FROM reading_lists WHERE member_id = @memberId) AS list_count
     FROM members m JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE m.member_id = @memberId`,
    { memberId }
  );
  if (limits.list_count >= limits.reading_list_limit) throw badRequest('Reading list limit reached');
  const [list] = await query(
    `INSERT INTO reading_lists(member_id, list_name, visibility_status)
     OUTPUT INSERTED.*
     VALUES(@memberId,@name,@visibility)`,
    { memberId, name: payload.list_name, visibility: payload.visibility_status || 'PRIVATE' }
  );
  return list;
}

export async function addItem(memberId, listId, publicationId) {
  const [list] = await query('SELECT * FROM reading_lists WHERE reading_list_id = @listId AND member_id = @memberId', {
    listId,
    memberId
  });
  if (!list) throw badRequest('Reading list not found');
  const [item] = await query(
    `INSERT INTO reading_list_items(reading_list_id, publication_id)
     OUTPUT INSERTED.*
     VALUES(@listId,@publicationId)`,
    { listId, publicationId }
  );
  return item;
}

export async function lists(memberId) {
  return query(
    `SELECT rl.*, COUNT(rli.item_id) AS item_count
     FROM reading_lists rl
     LEFT JOIN reading_list_items rli ON rli.reading_list_id = rl.reading_list_id
     WHERE rl.member_id = @memberId
     GROUP BY rl.reading_list_id, rl.member_id, rl.list_name, rl.visibility_status
     ORDER BY rl.reading_list_id DESC`,
    { memberId }
  );
}

