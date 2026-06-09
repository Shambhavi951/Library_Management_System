import { query } from '../database/db.js';
import { badRequest, notFound } from '../utils/errors.js';
import { notify } from './notificationService.js';
import { promoteNextHold } from './reservationService.js';

export async function borrowAvailable(memberId, publicationId, branchId) {
  const [memberBranchInfo] = await query(
    `SELECT m.home_branch_id, b_home.branch_name AS home_branch_name,
            b_req.branch_name AS requested_branch_name
     FROM members m
     LEFT JOIN branches b_home ON b_home.branch_id = m.home_branch_id
     LEFT JOIN branches b_req ON b_req.branch_id = @branchId
     WHERE m.member_id = @memberId`,
    { memberId, branchId }
  );
  if (!memberBranchInfo) throw notFound('Member not found');
  if (Number(branchId) !== Number(memberBranchInfo.home_branch_id)) {
    throw badRequest(`You cannot borrow a book from a different branch. Your branch is ${memberBranchInfo.home_branch_name || 'your home branch'}, but you requested ${memberBranchInfo.requested_branch_name || 'another branch'}.`);
  }

  const [limits] = await query(
    `SELECT mp.plan_name, mp.max_active_borrows,
            (SELECT COUNT(*) FROM borrowing_records WHERE member_id = @memberId AND borrow_status = 'ACTIVE') AS active_borrows,
            (SELECT COUNT(*) FROM borrowing_records br 
             JOIN inventory_copies ic ON ic.copy_id = br.copy_id
             WHERE br.member_id = @memberId 
               AND br.borrow_status = 'ACTIVE' 
               AND ic.publication_id = @publicationId) AS active_borrows_this_pub
     FROM members m JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE m.member_id = @memberId`,
    { memberId, publicationId }
  );
  if (limits.active_borrows >= limits.max_active_borrows) throw badRequest('Active borrow limit reached');
  if (limits.plan_name === 'STANDARD' && limits.active_borrows_this_pub >= 1) {
    throw badRequest('Standard members cannot borrow multiple copies of the same book');
  }
  const [copy] = await query(
    `SELECT TOP 1 * FROM inventory_copies
     WHERE publication_id = @publicationId AND branch_id = @branchId AND copy_status = 'AVAILABLE'
     ORDER BY copy_id`,
    { publicationId, branchId }
  );
  if (!copy) throw notFound('No available copy at this branch');
  return createBorrow(memberId, copy.copy_id);
}

export async function borrowHold(memberId, holdId) {
  const [hold] = await query(
    `SELECT bh.*, ic.publication_id FROM book_holds bh 
     JOIN inventory_copies ic ON ic.copy_id = bh.copy_id
     WHERE bh.hold_id = @holdId AND bh.member_id = @memberId AND bh.hold_status = 'ACTIVE' AND bh.hold_expiry > GETDATE()`,
    { holdId, memberId }
  );
  if (!hold) throw notFound('Active hold not found');

  const [limits] = await query(
    `SELECT mp.plan_name, mp.max_active_borrows,
            (SELECT COUNT(*) FROM borrowing_records WHERE member_id = @memberId AND borrow_status = 'ACTIVE') AS active_borrows,
            (SELECT COUNT(*) FROM borrowing_records br 
             JOIN inventory_copies ic ON ic.copy_id = br.copy_id
             WHERE br.member_id = @memberId 
               AND br.borrow_status = 'ACTIVE' 
               AND ic.publication_id = @publicationId) AS active_borrows_this_pub
     FROM members m JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE m.member_id = @memberId`,
    { memberId, publicationId: hold.publication_id }
  );
  if (limits.active_borrows >= limits.max_active_borrows) throw badRequest('Active borrow limit reached');
  if (limits.plan_name === 'STANDARD' && limits.active_borrows_this_pub >= 1) {
    throw badRequest('Standard members cannot borrow multiple copies of the same book');
  }

  const borrow = await createBorrow(memberId, hold.copy_id);
  await query(
    `UPDATE book_holds SET hold_status = 'BORROWED' WHERE hold_id = @holdId;
     UPDATE reservation_queue SET reservation_status = 'FULFILLED' WHERE reservation_id = @reservationId`,
    { holdId, reservationId: hold.reservation_id }
  );
  return borrow;
}

export async function returnBook(copyId, adminBranchId) {
  const [copy] = await query('SELECT * FROM inventory_copies WHERE copy_id = @copyId', { copyId });
  if (!copy) throw notFound('Copy not found');
  if (adminBranchId && Number(copy.branch_id) !== Number(adminBranchId)) throw badRequest('Copy belongs to another branch');
  
  const [borrow] = await query(
    `SELECT * FROM borrowing_records WHERE copy_id = @copyId AND borrow_status = 'ACTIVE'`,
    { copyId }
  );
  
  let fineAmount = 0;
  if (borrow) {
    const dueDate = new Date(borrow.due_date);
    const now = new Date();
    if (now > dueDate) {
      const diffTime = Math.abs(now - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const [settings] = await query('SELECT TOP 1 fine_per_day FROM owner_settings ORDER BY setting_id DESC');
      const finePerDay = settings ? Number(settings.fine_per_day) : 10;
      fineAmount = diffDays * finePerDay;
    }
    
    await query(
      `UPDATE borrowing_records SET returned_date = GETDATE(), borrow_status = 'RETURNED', fine_amount = @fineAmount
       WHERE borrow_id = @borrowId`,
      { borrowId: borrow.borrow_id, fineAmount }
    );
  }
  
  const hold = await promoteNextHold(copy.publication_id, copy.branch_id, copyId);
  
  return { status: hold ? 'ON_HOLD' : 'AVAILABLE', fine_amount: fineAmount };
}

async function createBorrow(memberId, copyId) {
  const [borrow] = await query(
    `UPDATE inventory_copies SET copy_status = 'BORROWED' WHERE copy_id = @copyId;
     INSERT INTO borrowing_records(copy_id, member_id, due_date, borrow_status, fine_amount)
     OUTPUT INSERTED.*
     VALUES(@copyId, @memberId, DATEADD(day, 14, GETDATE()), 'ACTIVE', 0)`,
    { memberId, copyId }
  );
  return borrow;
}

export async function processQuality(copyId, condition, remarks) {
  const [copy] = await query('SELECT * FROM inventory_copies WHERE copy_id = @copyId', { copyId });
  if (!copy) throw notFound('Copy not found');
  await query(
    `INSERT INTO quality_checks(copy_id, previous_condition, updated_condition, remarks, inspection_date)
     VALUES(@copyId,@previous,@condition,@remarks,GETDATE());
     UPDATE inventory_copies SET copy_condition = @condition, copy_status = @status WHERE copy_id = @copyId`,
    {
      copyId,
      previous: copy.copy_condition,
      condition,
      remarks,
      status: condition === 'DAMAGED' ? 'MAINTENANCE' : condition === 'LOST' ? 'LOST' : 'AVAILABLE'
    }
  );
  if (condition === 'GOOD' || condition === 'FAIR') {
    return promoteNextHold(copy.publication_id, copy.branch_id, copyId);
  }
  if (condition === 'DAMAGED' || condition === 'LOST') {
    await notify(null, 'COPY_MAINTENANCE', 'Copy Maintenance Required', `Copy #${copyId} has been marked as ${condition} during quality check.`, copy.branch_id);
  }
  return { condition };
}

export async function memberHistory(memberId) {
  return query(
    `SELECT br.*, p.title, ic.copy_number, b.branch_name
     FROM borrowing_records br
     JOIN inventory_copies ic ON ic.copy_id = br.copy_id
     JOIN publications p ON p.publication_id = ic.publication_id
     JOIN branches b ON b.branch_id = ic.branch_id
     WHERE br.member_id = @memberId
     ORDER BY br.borrowed_date DESC`,
    { memberId }
  );
}
