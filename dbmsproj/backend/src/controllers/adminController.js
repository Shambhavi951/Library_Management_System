import Joi from 'joi';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/http.js';
import { query } from '../database/db.js';
import { hashPassword } from '../auth/passwords.js';
import { badRequest } from '../utils/errors.js';
import * as inventory from '../services/inventoryService.js';
import * as borrow from '../services/borrowService.js';
import * as transfers from '../services/transferService.js';
import * as acquisition from '../services/acquisitionService.js';
import * as analytics from '../services/analyticsService.js';
import * as notification from '../services/notificationService.js';
import { ensureEmailAvailableForRole } from '../services/authService.js';

export const schemas = {
  publication: Joi.object({
    title: Joi.string().required(),
    publication_year: Joi.number().integer().min(1450).max(new Date().getFullYear()).allow(null),
    publisher_name: Joi.string().allow('', null),
    language_name: Joi.string().allow('', null),
    isbn: Joi.string().allow('', null),
    edition_name: Joi.string().allow('', null),
    page_count: Joi.number().integer().min(1).allow(null)
  }),
  copy: Joi.object({
    publication_id: Joi.number().required(),
    branch_id: Joi.number().required(),
    copy_number: Joi.number().integer().min(1).required(),
    copy_condition: Joi.string().valid('GOOD', 'FAIR', 'DAMAGED', 'LOST').default('GOOD'),
    floor_number: Joi.number().integer().min(0).allow(null),
    section_code: Joi.string().allow('', null),
    shelf_number: Joi.string().allow('', null),
    rack_number: Joi.string().allow('', null),
    position_number: Joi.string().allow('', null),
    qr_identifier: Joi.string().allow('', null),
    barcode_identifier: Joi.string().allow('', null)
  }),
  copyPatch: Joi.object({
    copy_condition: Joi.string().valid('GOOD', 'FAIR', 'DAMAGED', 'LOST'),
    copy_status: Joi.string(),
    floor_number: Joi.number().integer().min(0),
    section_code: Joi.string(),
    shelf_number: Joi.string(),
    rack_number: Joi.string(),
    position_number: Joi.string()
  }),
  returnBook: Joi.object({ copy_id: Joi.number().required() }),
  quality: Joi.object({ copy_id: Joi.number().required(), condition: Joi.string().valid('GOOD', 'FAIR', 'DAMAGED', 'LOST').required(), remarks: Joi.string().allow('', null) }),
  transfer: Joi.object({ transfer_status: Joi.string().valid('REQUESTED', 'APPROVED', 'IN_TRANSIT', 'ARRIVED', 'SHELVED', 'READY_FOR_PICKUP').required() }),
  acquisition: Joi.object({ request_status: Joi.string().valid('REQUESTED', 'UNDER_REVIEW', 'ORDERED', 'ARRIVED', 'CATALOGED', 'AVAILABLE', 'REJECTED').required() }),
  approveHold: Joi.object({ notification_id: Joi.number().required() }),
  member: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    phone_number: Joi.string().allow('', null),
    home_branch_id: Joi.number().integer().required(),
    plan_name: Joi.string().valid('STANDARD', 'PREMIUM').required(),
    join_date: Joi.date().allow('', null),
    password: Joi.string().min(8).allow('', null)
  })
};

export const inventoryList = asyncHandler(async (req, res) => ok(res, await inventory.listInventory(req.user.role_type === 'OWNER' ? req.query.branchId : req.user.branch_id)));
export const publicationsList = asyncHandler(async (req, res) => ok(res, await inventory.listPublications()));
export const addPublication = asyncHandler(async (req, res) => created(res, await inventory.addPublication(req.body)));
export const updatePublication = asyncHandler(async (req, res) => ok(res, await inventory.updatePublication(Number(req.params.publicationId), req.body)));
export const addCopy = asyncHandler(async (req, res) => created(res, await inventory.addCopy(req.body, req.user.role_type === 'ADMIN' ? req.user.branch_id : null)));
export const updateCopy = asyncHandler(async (req, res) => ok(res, await inventory.updateCopy(Number(req.params.copyId), req.body, req.user.role_type === 'ADMIN' ? req.user.branch_id : null)));
export const removeCopy = asyncHandler(async (req, res) => ok(res, await inventory.removeCopy(Number(req.params.copyId), req.user.role_type === 'ADMIN' ? req.user.branch_id : null)));
export const removePublication = asyncHandler(async (req, res) => ok(res, await inventory.removePublication(Number(req.params.publicationId))));
export const returnBook = asyncHandler(async (req, res) => ok(res, await borrow.returnBook(req.body.copy_id, req.user.role_type === 'ADMIN' ? req.user.branch_id : null)));
export const qualityCheck = asyncHandler(async (req, res) => ok(res, await borrow.processQuality(req.body.copy_id, req.body.condition, req.body.remarks)));
export const transfersList = asyncHandler(async (req, res) => ok(res, await transfers.listTransfers(req.user.role_type === 'ADMIN' ? req.user.branch_id : null)));
export const updateTransfer = asyncHandler(async (req, res) => ok(res, await transfers.updateTransfer(Number(req.params.transferId), req.body.transfer_status, req.user.role_type === 'ADMIN' ? req.user.branch_id : null)));
export const acquisitionList = asyncHandler(async (req, res) => ok(res, await acquisition.listRequests(null, req.user.role_type === 'ADMIN' ? req.user.branch_id : null)));
export const updateAcquisition = asyncHandler(async (req, res) => ok(res, await acquisition.updateRequestStatus(Number(req.params.requestId), req.body.request_status)));
export const analyticsDashboard = asyncHandler(async (req, res) => ok(res, await analytics.branchAnalytics(req.user.branch_id)));
export const notifications = asyncHandler(async (req, res) => ok(res, await notification.listAdminNotifications(req.user.branch_id)));
export const markNotification = asyncHandler(async (req, res) => ok(res, await notification.markAdminRead(req.user.branch_id, Number(req.params.notificationId))));

export const membersList = asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT m.member_id, m.first_name, m.last_name, m.email, m.phone_number, m.home_branch_id, hb.branch_name AS home_branch_name, 
            m.membership_plan_id, mp.plan_name, 
            m.join_date, m.active_status, ua.password_hash
     FROM members m
     LEFT JOIN user_accounts ua ON ua.member_id = m.member_id
     LEFT JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     LEFT JOIN branches hb ON hb.branch_id = m.home_branch_id
     ORDER BY m.join_date DESC`
  );
  ok(res, rows);
});

export const createMember = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!password) throw badRequest('Password is required when creating a member');
  await ensureEmailAvailableForRole(email, 'MEMBER');
  validateMemberDates(req.body.join_date);

  const [plan] = await query('SELECT membership_plan_id FROM membership_plans WHERE plan_name = @plan', {
    plan: req.body.plan_name
  });
  if (!plan) throw badRequest('Membership plan not found');

  const { hash, salt } = await hashPassword(password);
  const rows = await query(
    `DECLARE @memberIds TABLE(id INT);
     INSERT INTO members(first_name,last_name,email,phone_number,home_branch_id,preferred_branch_id,membership_plan_id)
     OUTPUT INSERTED.member_id INTO @memberIds
     VALUES(@firstName,@lastName,@email,@phone,@homeBranchId,@prefBranchId,@planId);
     INSERT INTO user_accounts(username,email,password_hash,password_salt,role_type,member_id,branch_id)
     SELECT @email,@email,@hash,@salt,'MEMBER',id,@prefBranchId FROM @memberIds;
     SELECT m.member_id, m.first_name, m.last_name, m.email, m.phone_number, m.membership_plan_id, ua.password_hash
     FROM members m
     JOIN user_accounts ua ON ua.member_id = m.member_id
     WHERE m.member_id = (SELECT id FROM @memberIds);`,
    {
      firstName: req.body.first_name,
      lastName: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone_number || null,
      homeBranchId: req.body.home_branch_id,
      prefBranchId: req.body.home_branch_id,
      planId: plan.membership_plan_id,
      hash,
      salt
    }
  );
  created(res, rows[0]);
});

export const updateMember = asyncHandler(async (req, res) => {
  const memberId = Number(req.params.memberId);
  const { password, plan_name } = req.body;
  const [account] = await query('SELECT account_id FROM user_accounts WHERE member_id = @memberId', { memberId });
  await ensureEmailAvailableForRole(req.body.email, 'MEMBER', account?.account_id || null);
  validateMemberDates(req.body.join_date);

  const [plan] = await query('SELECT membership_plan_id FROM membership_plans WHERE plan_name = @plan_name', { plan_name });
  if (!plan) throw badRequest('Membership plan not found');

  let hash, salt;
  if (password) {
    const hashed = await hashPassword(password);
    hash = hashed.hash;
    salt = hashed.salt;
  }

  await query(
    `UPDATE members 
     SET first_name = @firstName, last_name = @lastName, email = @email, phone_number = @phone, 
         home_branch_id = @homeBranchId, preferred_branch_id = @homeBranchId, membership_plan_id = @planId
     WHERE member_id = @memberId`,
    {
      firstName: req.body.first_name,
      lastName: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone_number || null,
      homeBranchId: req.body.home_branch_id,
      planId: plan.membership_plan_id,
      memberId
    }
  );

  if (hash) {
    await query(
      `UPDATE user_accounts 
       SET username = @email, email = @email, password_hash = @hash, password_salt = @salt, branch_id = @prefBranchId
       WHERE member_id = @memberId`,
      { email: req.body.email, hash, salt, prefBranchId: req.body.home_branch_id, memberId }
    );
  } else {
    await query(
      `UPDATE user_accounts 
       SET username = @email, email = @email, branch_id = @prefBranchId
       WHERE member_id = @memberId`,
      { email: req.body.email, prefBranchId: req.body.home_branch_id, memberId }
    );
  }

  const [member] = await query(
    `SELECT m.member_id, m.first_name, m.last_name, m.email, m.phone_number, m.membership_plan_id, ua.password_hash
     FROM members m
     JOIN user_accounts ua ON ua.member_id = m.member_id
     WHERE m.member_id = @memberId`,
    { memberId }
  );
  ok(res, member);
});

export const deactivateMember = asyncHandler(async (req, res) => {
  const memberId = Number(req.params.memberId);
  const [member] = await query('SELECT * FROM members WHERE member_id = @memberId', { memberId });
  if (!member) throw badRequest('Member not found');

  const [locks] = await query(
    `SELECT
       (SELECT COUNT(*) FROM borrowing_records WHERE member_id = @memberId AND borrow_status = 'ACTIVE') AS active_borrows,
       (SELECT COUNT(*) FROM borrowing_records WHERE member_id = @memberId AND COALESCE(fine_amount,0) > 0) AS pending_fines,
       (SELECT COUNT(*) FROM reservation_queue WHERE member_id = @memberId AND reservation_status IN ('QUEUED','ON_HOLD')) AS active_reservations`,
    { memberId }
  );
  if (locks.active_borrows > 0) throw badRequest('Cannot deactivate a member with unreturned books');
  if (locks.pending_fines > 0) throw badRequest('Cannot deactivate a member with pending fines');
  if (locks.active_reservations > 0) throw badRequest('Cannot deactivate a member with active reservations');

  await query(
    `UPDATE members SET active_status = 'N' WHERE member_id = @memberId;
     UPDATE user_accounts SET active_status = 'N' WHERE member_id = @memberId`,
    { memberId }
  );
  ok(res, { deactivated: true });
});

export const approveHold = asyncHandler(async (req, res) => {
  const { notification_id } = req.body;
  const [notif] = await query('SELECT * FROM notifications WHERE notification_id = @notification_id', { notification_id });
  if (!notif) throw badRequest('Notification not found');
  
  const match = notif.message_body.match(/\[Hold #(\d+)\]/);
  if (!match) throw badRequest('Invalid notification format');
  const holdId = Number(match[1]);

  const [hold] = await query('SELECT * FROM book_holds WHERE hold_id = @holdId', { holdId });
  if (!hold) throw badRequest('Hold not found');

  const borrowRecord = await borrow.borrowHold(hold.member_id, holdId);

  await query('UPDATE notifications SET read_status = \'Y\' WHERE notification_id = @notification_id', { notification_id });
  await notification.notify(hold.member_id, 'BORROW_APPROVED', 'Borrow Approved', `Your borrow for hold #${holdId} has been checked out by the branch admin.`);

  ok(res, borrowRecord);
});

function validateMemberDates(joinDate) {
  if (!joinDate) return;
  const parsed = new Date(joinDate);
  const now = new Date();
  const earliest = new Date('1990-01-01T00:00:00Z');
  if (Number.isNaN(parsed.getTime())) throw badRequest('Join date is invalid');
  if (parsed > now) throw badRequest('Join date cannot be in the future');
  if (parsed < earliest) throw badRequest('Join date is too far in the past');
}
