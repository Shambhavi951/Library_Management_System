import { query } from '../database/db.js';
import { badRequest, notFound } from '../utils/errors.js';
import { notify } from './notificationService.js';

export async function reserveBook(memberId, publicationId, branchId) {
  const [memberBranchInfo] = await query(
    `SELECT m.preferred_branch_id, b_pref.branch_name AS preferred_branch_name,
            b_req.branch_name AS requested_branch_name
     FROM members m
     LEFT JOIN branches b_pref ON b_pref.branch_id = m.preferred_branch_id
     LEFT JOIN branches b_req ON b_req.branch_id = @branchId
     WHERE m.member_id = @memberId`,
    { memberId, branchId }
  );
  if (!memberBranchInfo) throw notFound('Member not found');
  if (Number(branchId) !== Number(memberBranchInfo.preferred_branch_id)) {
    throw badRequest(`You cannot reserve a book from a different branch. Your active branch is ${memberBranchInfo.preferred_branch_name || 'your home branch'}, but you requested ${memberBranchInfo.requested_branch_name || 'another branch'}.`);
  }

  const [plan] = await query(
    `SELECT mp.reservation_limit
     FROM members m JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE m.member_id = @memberId`,
    { memberId }
  );
  const [{ active_count }] = await query(
    `SELECT COUNT(*) AS active_count FROM reservation_queue
     WHERE member_id = @memberId AND reservation_status IN ('QUEUED','ON_HOLD')`,
    { memberId }
  );
  if (active_count >= plan.reservation_limit) throw badRequest('Reservation limit reached for your membership plan');

  const [copy] = await query(
    `SELECT TOP 1 copy_id FROM inventory_copies
     WHERE publication_id = @publicationId AND branch_id = @branchId AND copy_status = 'AVAILABLE'
     ORDER BY copy_id`,
    { publicationId, branchId }
  );
  if (copy) throw badRequest('This book is available now. Borrow it instead of joining the queue.');

  const [{ next_position }] = await query(
    `SELECT COALESCE(MAX(queue_position),0) + 1 AS next_position
     FROM reservation_queue
     WHERE publication_id = @publicationId AND assigned_branch_id = @branchId AND reservation_status = 'QUEUED'`,
    { publicationId, branchId }
  );
  const [reservation] = await query(
    `INSERT INTO reservation_queue(member_id,publication_id,preferred_branch_id,assigned_branch_id,queue_position,reservation_status)
     OUTPUT INSERTED.*
     VALUES(@memberId,@publicationId,@branchId,@branchId,@position,'QUEUED')`,
    { memberId, publicationId, branchId, position: next_position }
  );
  await notify(memberId, 'QUEUE_MOVED', 'Reservation joined', `You are position ${next_position} in the queue.`);
  return reservation;
}

export async function cancelReservation(memberId, reservationId) {
  const [reservation] = await query(
    `SELECT * FROM reservation_queue WHERE reservation_id = @reservationId AND member_id = @memberId`,
    { reservationId, memberId }
  );
  if (!reservation) throw notFound('Reservation not found');
  await query(`UPDATE reservation_queue SET reservation_status = 'CANCELED' WHERE reservation_id = @reservationId`, { reservationId });
  await query(
    `UPDATE reservation_queue
     SET queue_position = queue_position - 1
     WHERE publication_id = @publicationId AND assigned_branch_id = @branchId
       AND reservation_status = 'QUEUED' AND queue_position > @position`,
    { publicationId: reservation.publication_id, branchId: reservation.assigned_branch_id, position: reservation.queue_position }
  );
  return { canceled: true };
}

export async function listMemberReservations(memberId) {
  return query(
    `SELECT r.*, p.title, b.branch_name,
            r.queue_position * 2 AS estimated_wait_days
     FROM reservation_queue r
     JOIN publications p ON p.publication_id = r.publication_id
     JOIN branches b ON b.branch_id = r.assigned_branch_id
     WHERE r.member_id = @memberId
     ORDER BY r.reservation_date DESC`,
    { memberId }
  );
}

export async function promoteNextHold(publicationId, branchId, copyId) {
  const [next] = await query(
    `SELECT TOP 1 r.*, mp.hold_duration_hours
     FROM reservation_queue r
     JOIN members m ON m.member_id = r.member_id
     JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE r.publication_id = @publicationId AND r.assigned_branch_id = @branchId AND r.reservation_status = 'QUEUED'
     ORDER BY r.queue_position, r.reservation_date`,
    { publicationId, branchId }
  );
  if (!next) {
    await query(`UPDATE inventory_copies SET copy_status = 'AVAILABLE' WHERE copy_id = @copyId`, { copyId });
    return null;
  }
  const [hold] = await query(
    `DECLARE @expiry DATETIME = DATEADD(hour, @hours, GETDATE());
     UPDATE inventory_copies SET copy_status = 'ON_HOLD' WHERE copy_id = @copyId;
     UPDATE reservation_queue SET reservation_status = 'ON_HOLD', hold_expiry = @expiry WHERE reservation_id = @reservationId;
     INSERT INTO book_holds(reservation_id, copy_id, member_id, hold_created, hold_expiry, hold_status)
     OUTPUT INSERTED.*
     VALUES(@reservationId, @copyId, @memberId, GETDATE(), @expiry, 'ACTIVE');
     UPDATE reservation_queue
       SET queue_position = queue_position - 1
       WHERE publication_id = @publicationId AND assigned_branch_id = @branchId
       AND reservation_status = 'QUEUED' AND queue_position > @position;`,
    {
      copyId,
      hours: next.hold_duration_hours,
      reservationId: next.reservation_id,
      memberId: next.member_id,
      publicationId,
      branchId,
      position: next.queue_position
    }
  );
  await notify(next.member_id, 'BOOK_READY', 'Book ready for pickup', 'A reserved book is now on hold for you.');
  await notify(null, 'BOOK_READY_ADMIN', 'Reserved Book Ready', `[Hold #${hold.hold_id}] Copy #${copyId} is ready for pickup by member #${next.member_id}.`, branchId);
  return hold;
}

