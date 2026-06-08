import Joi from 'joi';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/http.js';
import { query } from '../database/db.js';
import { hashPassword } from '../auth/passwords.js';
import * as analytics from '../services/analyticsService.js';
import * as notification from '../services/notificationService.js';

export const schemas = {
  admin: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    username: Joi.string().required(),
    password: Joi.string().min(8).required(),
    branch_id: Joi.number().required(),
    salary_amount: Joi.number().required(),
    hire_date: Joi.date().required()
  }),
  editAdmin: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    username: Joi.string().required(),
    password: Joi.string().min(8).allow('', null),
    branch_id: Joi.number().required(),
    salary_amount: Joi.number().required(),
    hire_date: Joi.date().required()
  }),
  settings: Joi.object({
    fine_per_day: Joi.number().required(),
    premium_membership_cost: Joi.number().required(),
    standard_membership_cost: Joi.number().required(),
    standard_hold_hours: Joi.number().required(),
    premium_hold_hours: Joi.number().required()
  }),
  branch: Joi.object({
    branch_name: Joi.string().required(),
    address_line: Joi.string().allow('', null),
    contact_number: Joi.string().allow('', null)
  })
};

export const analyticsDashboard = asyncHandler(async (req, res) => ok(res, await analytics.ownerAnalytics()));
export const getSettings = asyncHandler(async (req, res) => ok(res, await analytics.getOwnerSettings()));
export const settings = asyncHandler(async (req, res) => created(res, await analytics.updateOwnerSettings(req.body)));
export const notifications = asyncHandler(async (req, res) => ok(res, await notification.listOwnerNotifications()));

export const createAdmin = asyncHandler(async (req, res) => {
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

