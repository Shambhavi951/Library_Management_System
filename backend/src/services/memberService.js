import { query } from '../database/db.js';
import { badRequest } from '../utils/errors.js';

export async function switchBranch(memberId, branchId) {
  const [memberPlan] = await query(
    `SELECT mp.plan_name 
     FROM members m
     JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     WHERE m.member_id = @memberId`,
    { memberId }
  );
  if (!memberPlan || memberPlan.plan_name !== 'PREMIUM') {
    throw badRequest('Only premium members can switch branches');
  }

  const [member] = await query(
    `UPDATE members SET home_branch_id = @branchId, preferred_branch_id = @branchId
     OUTPUT INSERTED.*
     WHERE member_id = @memberId`,
    { memberId, branchId }
  );
  await query(
    `UPDATE user_accounts SET branch_id = @branchId WHERE member_id = @memberId`,
    { memberId, branchId }
  );
  return member;
}

export async function upgradeMembership(memberId, planName) {
  const [plan] = await query('SELECT * FROM membership_plans WHERE plan_name = @planName', { planName });
  if (!plan) throw badRequest('Membership plan not found');
  const [member] = await query(
    `UPDATE members SET membership_plan_id = @planId
     OUTPUT INSERTED.*
     WHERE member_id = @memberId`,
    { memberId, planId: plan.membership_plan_id }
  );
  return member;
}

export async function fines(memberId) {
  return query(
    `SELECT br.borrow_id, br.fine_amount, br.borrow_status, br.due_date, p.title
     FROM borrowing_records br
     JOIN inventory_copies ic ON ic.copy_id = br.copy_id
     JOIN publications p ON p.publication_id = ic.publication_id
     WHERE br.member_id = @memberId AND COALESCE(br.fine_amount,0) > 0`,
    { memberId }
  );
}
