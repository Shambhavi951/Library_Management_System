import { query } from '../database/db.js';
import { badRequest, forbidden } from '../utils/errors.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import { signAccessToken, signRefreshToken, verifyRefresh } from '../auth/tokens.js';

const roleByLogin = { member: 'MEMBER', admin: 'ADMIN', owner: 'OWNER' };

export async function registerMember(payload) {
  await ensureEmailAvailableForRole(payload.email, 'MEMBER');
  const [plan] = await query('SELECT membership_plan_id FROM membership_plans WHERE plan_name = @plan', {
    plan: payload.plan_name || 'STANDARD'
  });
  if (!plan) throw badRequest('Membership plan not found');
  const { hash, salt } = await hashPassword(payload.password);
  const rows = await query(
    `DECLARE @memberIds TABLE(id INT);
     INSERT INTO members(first_name,last_name,email,phone_number,home_branch_id,preferred_branch_id,membership_plan_id)
     OUTPUT INSERTED.member_id INTO @memberIds
     VALUES(@firstName,@lastName,@email,@phone,@branchId,@branchId,@planId);
     INSERT INTO user_accounts(username,email,password_hash,password_salt,role_type,member_id,branch_id)
     SELECT @email,@email,@hash,@salt,'MEMBER',id,@branchId FROM @memberIds;
     SELECT ua.account_id, ua.username, ua.email, ua.role_type, ua.member_id, ua.branch_id, mp.plan_name
     FROM user_accounts ua 
     LEFT JOIN members m ON m.member_id = ua.member_id
     LEFT JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE ua.email = @email;`,
    {
      firstName: payload.first_name,
      lastName: payload.last_name,
      email: payload.email,
      phone: payload.phone_number || null,
      branchId: payload.branch_id,
      planId: plan.membership_plan_id,
      hash,
      salt
    }
  );
  const account = rows.at(-1);
  return withTokens(account);
}

export async function ensureEmailAvailableForRole(email, roleType, currentAccountId = null) {
  const existing = await query(
    `SELECT account_id, role_type
     FROM user_accounts
     WHERE email = @email AND (@currentAccountId IS NULL OR account_id <> @currentAccountId)`,
    { email, roleType, currentAccountId }
  );
  if (existing.some((account) => account.role_type !== roleType)) {
    throw badRequest(`This email is already registered as a ${existing[0].role_type.toLowerCase()} account`);
  }
  if (existing.length) throw badRequest('An account with this email already exists');
}

export async function login({ email, password, login_type }) {
  const expectedRole = roleByLogin[login_type];
  if (!expectedRole) throw badRequest('Unknown login type');
  const [account] = await query(
    `SELECT ua.account_id, ua.username, ua.email, ua.password_hash, ua.role_type, ua.member_id, ua.branch_id, ua.active_status, b.branch_name, mp.plan_name
     FROM user_accounts ua 
     LEFT JOIN branches b ON b.branch_id = ua.branch_id
     LEFT JOIN members m ON m.member_id = ua.member_id
     LEFT JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE ua.email = @email AND ua.active_status = 'Y'`,
    { email }
  );
  if (!account || !(await verifyPassword(password, account.password_hash))) {
    throw forbidden('Invalid credentials');
  }
  if (account.role_type !== expectedRole) {
    throw forbidden(`${account.role_type.toLowerCase()} accounts cannot use ${login_type} login`);
  }
  delete account.password_hash;
  return withTokens(account);
}

export async function refresh(refreshToken) {
  const payload = verifyRefresh(refreshToken);
  const [account] = await query(
    `SELECT ua.account_id, ua.username, ua.email, ua.role_type, ua.member_id, ua.branch_id, mp.plan_name
     FROM user_accounts ua 
     LEFT JOIN members m ON m.member_id = ua.member_id
     LEFT JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE ua.account_id = @accountId AND ua.active_status = 'Y'`,
    { accountId: payload.sub }
  );
  if (!account) throw forbidden('Refresh token no longer matches an active account');
  return withTokens(account);
}

export async function me(accountId) {
  const [profile] = await query(
    `SELECT ua.account_id, ua.username, ua.email, ua.role_type, ua.member_id, ua.branch_id,
            b.branch_name, m.first_name, m.last_name, mp.plan_name, mp.max_active_borrows,
            mp.reservation_limit, mp.hold_duration_hours, mp.reading_list_limit
     FROM user_accounts ua
     LEFT JOIN branches b ON b.branch_id = ua.branch_id
     LEFT JOIN members m ON m.member_id = ua.member_id
     LEFT JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE ua.account_id = @accountId`,
    { accountId }
  );
  return profile;
}

function withTokens(account) {
  return {
    account,
    accessToken: signAccessToken(account),
    refreshToken: signRefreshToken(account)
  };
}
