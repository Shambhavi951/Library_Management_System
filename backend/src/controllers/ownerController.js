import Joi from 'joi';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/http.js';
import { query } from '../database/db.js';
import { hashPassword } from '../auth/passwords.js';
import { badRequest } from '../utils/errors.js';
import * as analytics from '../services/analyticsService.js';
import * as notification from '../services/notificationService.js';
import { ensureEmailAvailableForRole } from '../services/authService.js';

export const schemas = {
  admin: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    username: Joi.string().required(),
    password: Joi.string().min(8).required(),
    branch_id: Joi.number().required(),
    salary_amount: Joi.number().min(0).required(),
    hire_date: Joi.date().required()
  }),
  editAdmin: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    username: Joi.string().required(),
    password: Joi.string().min(8).allow('', null),
    branch_id: Joi.number().required(),
    salary_amount: Joi.number().min(0).required(),
    hire_date: Joi.date().required()
  }),
  settings: Joi.object({
    fine_per_day: Joi.number().min(0.01).max(10000).required(),
    premium_membership_cost: Joi.number().min(0).required(),
    standard_membership_cost: Joi.number().min(0).required(),
    standard_hold_hours: Joi.number().integer().min(1).required(),
    premium_hold_hours: Joi.number().integer().min(1).required()
  }),
  branch: Joi.object({
    branch_name: Joi.string().required(),
    address_line: Joi.string().allow('', null),
    contact_number: Joi.string().allow('', null)
  })
};

export const analyticsDashboard = asyncHandler(async (req, res) => ok(res, await analytics.ownerAnalytics()));
export const getSettings = asyncHandler(async (req, res) => ok(res, await analytics.getOwnerSettings()));
export const settings = asyncHandler(async (req, res) => {
  if (Number(req.body.premium_hold_hours) < Number(req.body.standard_hold_hours)) {
    throw badRequest('Premium hold hours cannot be less than standard hold hours');
  }
  created(res, await analytics.updateOwnerSettings(req.body));
});
export const notifications = asyncHandler(async (req, res) => ok(res, await notification.listOwnerNotifications()));
export const markNotification = asyncHandler(async (req, res) => ok(res, await notification.markOwnerRead(Number(req.params.notificationId))));

export const createAdmin = asyncHandler(async (req, res) => {
  await ensureEmailAvailableForRole(req.body.email, 'ADMIN');
  validateHireDate(req.body.hire_date);
  const { hash, salt } = await hashPassword(req.body.password);
  const rows = await query(
    `DECLARE @ids TABLE(id INT);
     INSERT INTO user_accounts(username,email,password_hash,password_salt,role_type,branch_id)
     OUTPUT INSERTED.account_id INTO @ids
     VALUES(@username,@email,@hash,@salt,'ADMIN',@branchId);
     INSERT INTO admin_profiles(account_id,branch_id,salary_amount,hire_date)
     SELECT id,@branchId,@salary,@hireDate FROM @ids;
     SELECT ua.account_id, ua.email, ua.username, ua.role_type, ua.branch_id
     FROM user_accounts ua WHERE ua.account_id = (SELECT id FROM @ids);`,
    {
      username: req.body.username,
      email: req.body.email,
      hash,
      salt,
      branchId: req.body.branch_id,
      salary: req.body.salary_amount,
      hireDate: req.body.hire_date
    }
  );
  created(res, rows[0]);
});

export const admins = asyncHandler(async (req, res) => ok(res, await query(
  `SELECT ua.account_id, ua.email, ua.username, ua.branch_id, b.branch_name, ap.salary_amount, ap.hire_date, ua.password_hash
   FROM user_accounts ua
   JOIN admin_profiles ap ON ap.account_id = ua.account_id
   JOIN branches b ON b.branch_id = ua.branch_id
   WHERE ua.role_type = 'ADMIN'
   ORDER BY b.branch_name, ua.username`
)));

export const editAdmin = asyncHandler(async (req, res) => {
  const accountId = Number(req.params.accountId);
  await ensureEmailAvailableForRole(req.body.email, 'ADMIN', accountId);
  validateHireDate(req.body.hire_date);
  let hash, salt;
  if (req.body.password) {
    const hashed = await hashPassword(req.body.password);
    hash = hashed.hash;
    salt = hashed.salt;
  }

  if (hash) {
    await query(
      `UPDATE user_accounts 
       SET username = @username, email = @email, password_hash = @hash, password_salt = @salt, branch_id = @branchId
       WHERE account_id = @accountId;`,
      { username: req.body.username, email: req.body.email, hash, salt, branchId: req.body.branch_id, accountId }
    );
  } else {
    await query(
      `UPDATE user_accounts 
       SET username = @username, email = @email, branch_id = @branchId
       WHERE account_id = @accountId;`,
      { username: req.body.username, email: req.body.email, branchId: req.body.branch_id, accountId }
    );
  }

  await query(
    `UPDATE admin_profiles 
     SET salary_amount = @salary, hire_date = @hireDate, branch_id = @branchId
     WHERE account_id = @accountId;`,
    { salary: req.body.salary_amount, hireDate: req.body.hire_date, branchId: req.body.branch_id, accountId }
  );

  const [admin] = await query(
    `SELECT ua.account_id, ua.email, ua.username, ua.branch_id, b.branch_name, ap.salary_amount, ap.hire_date, ua.password_hash
     FROM user_accounts ua
     JOIN admin_profiles ap ON ap.account_id = ua.account_id
     JOIN branches b ON b.branch_id = ua.branch_id
     WHERE ua.account_id = @accountId`,
    { accountId }
  );
  ok(res, admin);
});

export const createBranch = asyncHandler(async (req, res) => created(res, (await query(
  `INSERT INTO branches(branch_name,address_line,contact_number,branch_status)
   OUTPUT INSERTED.*
   VALUES(@name,@address,@contact,'ACTIVE')`,
  { name: req.body.branch_name, address: req.body.address_line || null, contact: req.body.contact_number || null }
))[0]));




export const deactivateAdmin = asyncHandler(async (req, res) => {
  const accountId = Number(req.params.accountId);
  const [admin] = await query('SELECT account_id FROM user_accounts WHERE account_id = @accountId AND role_type = \'ADMIN\'', { accountId });
  if (!admin) throw badRequest('Admin account not found');
  await query('UPDATE user_accounts SET active_status = \'N\' WHERE account_id = @accountId', { accountId });
  ok(res, { deactivated: true });
});

export const deactivateBranch = asyncHandler(async (req, res) => {
  const branchId = Number(req.params.branchId);
  const [locks] = await query(
    `SELECT
       (SELECT COUNT(*) FROM members WHERE home_branch_id = @branchId AND active_status = 'Y') AS active_members,
       (SELECT COUNT(*) FROM user_accounts WHERE branch_id = @branchId AND active_status = 'Y') AS active_accounts,
       (SELECT COUNT(*) FROM inventory_copies WHERE branch_id = @branchId AND copy_status <> 'REMOVED') AS active_copies,
       (SELECT COUNT(*) FROM branch_transfers WHERE (source_branch_id = @branchId OR destination_branch_id = @branchId) AND transfer_status IN ('REQUESTED','APPROVED','IN_TRANSIT','ARRIVED','READY_FOR_PICKUP')) AS active_transfers`,
    { branchId }
  );
  if (locks.active_members > 0 || locks.active_accounts > 0 || locks.active_copies > 0 || locks.active_transfers > 0) {
    throw badRequest('Cannot deactivate a branch with active people, inventory, or transfers');
  }
  const [branch] = await query(
    `UPDATE branches SET branch_status = 'INACTIVE'
     OUTPUT INSERTED.*
     WHERE branch_id = @branchId`,
    { branchId }
  );
  if (!branch) throw badRequest('Branch not found');
  ok(res, branch);
});

function validateHireDate(hireDate) {
  const parsed = new Date(hireDate);
  const now = new Date();
  const earliest = new Date('1990-01-01T00:00:00Z');
  if (Number.isNaN(parsed.getTime())) throw badRequest('Hire date is invalid');
  if (parsed > now) throw badRequest('Hire date cannot be in the future');
  if (parsed < earliest) throw badRequest('Hire date is too far in the past');
}
