import { query } from '../database/db.js';
import { badRequest, notFound } from '../utils/errors.js';

export async function listInventory(branchId) {
  return query(
    `SELECT ic.*, p.title, bk.isbn, b.branch_name
     FROM inventory_copies ic
     JOIN publications p ON p.publication_id = ic.publication_id
     LEFT JOIN books bk ON bk.publication_id = p.publication_id
     JOIN branches b ON b.branch_id = ic.branch_id
     WHERE (CAST(@branchId AS INT) IS NULL OR ic.branch_id = CAST(@branchId AS INT))
       AND ic.copy_status <> 'REMOVED'
     ORDER BY b.branch_name, p.title, ic.copy_number`,
    { branchId: branchId || null }
  );
}

export async function listPublications() {
  return query(
    `SELECT p.publication_id, p.title, p.publication_year, p.publisher_name, p.language_name, bk.isbn, bk.page_count
     FROM publications p
     LEFT JOIN books bk ON bk.publication_id = p.publication_id
     WHERE p.publication_status <> 'REMOVED'
     ORDER BY p.title`
  );
}

export async function addPublication(payload) {
  validatePublication(payload);
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

export async function updatePublication(publicationId, payload) {
  validatePublication(payload);
  const [updated] = await query(
    `UPDATE publications
     SET title = @title,
         publication_year = @year,
         publisher_name = @publisher,
         language_name = @language
     OUTPUT INSERTED.*
     WHERE publication_id = @publicationId AND publication_status <> 'REMOVED';
     UPDATE books
     SET isbn = @isbn,
         edition_name = @edition,
         page_count = @pages
     WHERE publication_id = @publicationId;
     SELECT p.*, b.isbn, b.edition_name, b.page_count
     FROM publications p
     LEFT JOIN books b ON b.publication_id = p.publication_id
     WHERE p.publication_id = @publicationId`,
    {
      publicationId,
      title: payload.title,
      year: payload.publication_year || null,
      publisher: payload.publisher_name || null,
      language: payload.language_name || 'English',
      isbn: payload.isbn || null,
      edition: payload.edition_name || null,
      pages: payload.page_count || null
    }
  );
  if (!updated) throw notFound('Publication not found');
  return updated;
}

export async function addCopy(payload, adminBranchId) {
  if (adminBranchId && Number(payload.branch_id) !== Number(adminBranchId)) {
    throw badRequest('Admins can only add copies to their own branch');
  }
  await validateCopyPlacement(payload);
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
  await validateCopyPlacement({ ...copy, ...payload, branch_id: copy.branch_id }, copyId);
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

export async function removeCopy(copyId, adminBranchId) {
  const [copy] = await query('SELECT * FROM inventory_copies WHERE copy_id = @copyId', { copyId });
  if (!copy) throw notFound('Copy not found');
  if (adminBranchId && Number(copy.branch_id) !== Number(adminBranchId)) throw badRequest('Admins can only remove local inventory');
  if (['BORROWED', 'ON_HOLD', 'IN_TRANSIT'].includes(copy.copy_status)) {
    throw badRequest('Cannot remove a copy that is borrowed, on hold, or in transfer');
  }
  const [activeTransfer] = await query(
    `SELECT TOP 1 transfer_id FROM branch_transfers
     WHERE copy_id = @copyId AND transfer_status IN ('REQUESTED','APPROVED','IN_TRANSIT','ARRIVED','READY_FOR_PICKUP')`,
    { copyId }
  );
  if (activeTransfer) throw badRequest('Cannot remove a copy with an active transfer');
  const [removed] = await query(
    `UPDATE inventory_copies SET copy_status = 'REMOVED'
     OUTPUT INSERTED.*
     WHERE copy_id = @copyId`,
    { copyId }
  );
  return removed;
}

export async function removePublication(publicationId) {
  const [locks] = await query(
    `SELECT
       (SELECT COUNT(*) FROM inventory_copies WHERE publication_id = @publicationId AND copy_status <> 'REMOVED') AS active_copies,
       (SELECT COUNT(*) FROM borrowing_records br JOIN inventory_copies ic ON ic.copy_id = br.copy_id WHERE ic.publication_id = @publicationId) AS borrow_history`,
    { publicationId }
  );
  if (locks.active_copies > 0) throw badRequest('Cannot remove a publication while inventory copies still exist');
  if (locks.borrow_history > 0) throw badRequest('Cannot remove a publication with borrow history');
  const [removed] = await query(
    `UPDATE publications SET publication_status = 'REMOVED'
     OUTPUT INSERTED.*
     WHERE publication_id = @publicationId`,
    { publicationId }
  );
  if (!removed) throw notFound('Publication not found');
  return removed;
}

async function validateCopyPlacement(payload, currentCopyId = null) {
  if (Number(payload.floor_number || 0) < 0) throw badRequest('Floor number cannot be negative');
  const [publication] = await query('SELECT publication_id FROM publications WHERE publication_id = @publicationId AND publication_status <> \'REMOVED\'', {
    publicationId: payload.publication_id
  });
  if (!publication) throw badRequest('Publication not found');

  const [copyNumberConflict] = await query(
    `SELECT TOP 1 copy_id FROM inventory_copies
     WHERE publication_id = @publicationId AND branch_id = @branchId AND copy_number = @copyNumber
       AND copy_status <> 'REMOVED'
       AND (CAST(@currentCopyId AS INT) IS NULL OR copy_id <> CAST(@currentCopyId AS INT))`,
    {
      publicationId: payload.publication_id,
      branchId: payload.branch_id,
      copyNumber: payload.copy_number,
      currentCopyId
    }
  );
  if (copyNumberConflict) throw badRequest('Copy number must be unique for this publication at this branch');

  const [locationConflict] = await query(
    `SELECT TOP 1 copy_id FROM inventory_copies
     WHERE branch_id = @branchId
       AND COALESCE(floor_number, -1) = COALESCE(@floor, -1)
       AND COALESCE(section_code, '') = COALESCE(@section, '')
       AND COALESCE(shelf_number, '') = COALESCE(@shelf, '')
       AND COALESCE(rack_number, '') = COALESCE(@rack, '')
       AND COALESCE(position_number, '') = COALESCE(@position, '')
       AND copy_status <> 'REMOVED'
       AND (CAST(@currentCopyId AS INT) IS NULL OR copy_id <> CAST(@currentCopyId AS INT))`,
    {
      branchId: payload.branch_id,
      floor: payload.floor_number || 1,
      section: payload.section_code || 'GEN',
      shelf: payload.shelf_number || 'A1',
      rack: payload.rack_number || 'A',
      position: payload.position_number || '1',
      currentCopyId
    }
  );
  if (locationConflict) throw badRequest('Another copy already occupies that exact shelf location');
}

function validatePublication(payload) {
  const year = Number(payload.publication_year);
  if (payload.publication_year && (year > new Date().getFullYear() || year < 1450)) {
    throw badRequest('Publication year must be realistic and not in the future');
  }
  if (payload.page_count && Number(payload.page_count) <= 0) throw badRequest('Page count must be positive');
}
