import { query } from '../database/db.js';
import { badRequest, notFound } from '../utils/errors.js';

export async function listInventory(branchId) {
  return query(
    `SELECT ic.*, p.title, bk.isbn, b.branch_name
     FROM inventory_copies ic
     JOIN publications p ON p.publication_id = ic.publication_id
     LEFT JOIN books bk ON bk.publication_id = p.publication_id
     JOIN branches b ON b.branch_id = ic.branch_id
     WHERE (@branchId IS NULL OR ic.branch_id = @branchId)
     ORDER BY b.branch_name, p.title, ic.copy_number`,
    { branchId: branchId || null }
  );
}

export async function listPublications() {
  return query(
    `SELECT p.publication_id, p.title, p.publication_year, p.publisher_name, p.language_name, bk.isbn, bk.page_count
     FROM publications p
     LEFT JOIN books bk ON bk.publication_id = p.publication_id
     ORDER BY p.title`
  );
}

export async function addPublication(payload) {
  const rows = await query(
    `DECLARE @ids TABLE(id INT);
     INSERT INTO publications(title, publication_year, publisher_name, language_name, publication_type, popularity_score, publication_status)
     OUTPUT INSERTED.publication_id INTO @ids
     VALUES(@title,@year,@publisher,@language,'BOOK',0,'AVAILABLE');
     INSERT INTO books(publication_id,isbn,edition_name,page_count)
     SELECT id,@isbn,@edition,@pages FROM @ids;
     SELECT p.*, b.isbn, b.edition_name, b.page_count FROM publications p
     JOIN books b ON b.publication_id = p.publication_id
     WHERE p.publication_id = (SELECT id FROM @ids);`,
    {
      title: payload.title,
      year: payload.publication_year || null,
      publisher: payload.publisher_name || null,
      language: payload.language_name || 'English',
      isbn: payload.isbn || null,
      edition: payload.edition_name || null,
      pages: payload.page_count || null
    }
  );
  return rows[0];
}

export async function addCopy(payload, adminBranchId) {
  if (adminBranchId && Number(payload.branch_id) !== Number(adminBranchId)) {
    throw badRequest('Admins can only add copies to their own branch');
  }
  const [copy] = await query(
    `INSERT INTO inventory_copies(publication_id, branch_id, copy_number, copy_condition, copy_status,
       floor_number, section_code, shelf_number, rack_number, position_number, qr_identifier, barcode_identifier)
     OUTPUT INSERTED.*
     VALUES(@publicationId,@branchId,@copyNumber,@condition,'AVAILABLE',@floor,@section,@shelf,@rack,@position,@qr,@barcode)`,
    {
      publicationId: payload.publication_id,
      branchId: payload.branch_id,
      copyNumber: payload.copy_number,
      condition: payload.copy_condition || 'GOOD',
      floor: payload.floor_number || 1,
      section: payload.section_code || 'GEN',
      shelf: payload.shelf_number || 'A1',
      rack: payload.rack_number || 'A',
      position: payload.position_number || '1',
      qr: payload.qr_identifier || null,
      barcode: payload.barcode_identifier || null
    }
  );
  return copy;
}

export async function updateCopy(copyId, payload, adminBranchId) {
  const [copy] = await query('SELECT * FROM inventory_copies WHERE copy_id = @copyId', { copyId });
  if (!copy) throw notFound('Copy not found');
  if (adminBranchId && Number(copy.branch_id) !== Number(adminBranchId)) throw badRequest('Admins can only edit local inventory');
  const [updated] = await query(
    `UPDATE inventory_copies
     SET copy_condition = COALESCE(@condition, copy_condition),
         copy_status = COALESCE(@status, copy_status),
         floor_number = COALESCE(@floor, floor_number),
         section_code = COALESCE(@section, section_code),
         shelf_number = COALESCE(@shelf, shelf_number),
         rack_number = COALESCE(@rack, rack_number),
         position_number = COALESCE(@position, position_number)
     OUTPUT INSERTED.*
     WHERE copy_id = @copyId`,
    {
      copyId,
      condition: payload.copy_condition || null,
      status: payload.copy_status || null,
      floor: payload.floor_number || null,
      section: payload.section_code || null,
      shelf: payload.shelf_number || null,
      rack: payload.rack_number || null,
      position: payload.position_number || null
    }
  );
  return updated;
}
