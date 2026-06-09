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

export async function updateList(memberId, listId, payload) {
  const [updated] = await query(
    `UPDATE reading_lists
     SET list_name = @name, visibility_status = @visibility
     OUTPUT INSERTED.*
     WHERE reading_list_id = @listId AND member_id = @memberId`,
    {
      memberId,
      listId,
      name: payload.list_name,
      visibility: payload.visibility_status || 'PRIVATE'
    }
  );
  if (!updated) throw badRequest('Reading list not found');
  return updated;
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

export async function deleteList(memberId, listId) {
  const [list] = await query('SELECT * FROM reading_lists WHERE reading_list_id = @listId AND member_id = @memberId', {
    listId,
    memberId
  });
  if (!list) throw badRequest('Reading list not found');
  await query(
    `DELETE FROM reading_list_items WHERE reading_list_id = @listId;
     DELETE FROM reading_lists WHERE reading_list_id = @listId`,
    { listId }
  );
  return { deleted: true };
}

export async function items(memberId, listId) {
  const [list] = await query(
    'SELECT * FROM reading_lists WHERE reading_list_id = @listId AND (member_id = @memberId OR visibility_status = \'PUBLIC\')',
    { listId, memberId }
  );
  if (!list) throw badRequest('Reading list not found or is private');
  return query(
    `SELECT rli.item_id, rli.reading_list_id, p.publication_id, p.title, p.publisher_name, p.publication_year, bk.isbn
     FROM reading_list_items rli
     JOIN publications p ON p.publication_id = rli.publication_id
     LEFT JOIN books bk ON bk.publication_id = p.publication_id
     WHERE rli.reading_list_id = @listId
     ORDER BY rli.item_id DESC`,
    { listId }
  );
}

export async function removeItem(memberId, listId, itemId) {
  const [list] = await query('SELECT * FROM reading_lists WHERE reading_list_id = @listId AND member_id = @memberId', {
    listId,
    memberId
  });
  if (!list) throw badRequest('Reading list not found');
  await query('DELETE FROM reading_list_items WHERE item_id = @itemId AND reading_list_id = @listId', { itemId, listId });
  return { deleted: true };
}

