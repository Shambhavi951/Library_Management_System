import { query } from '../database/db.js';

export async function branchAnalytics(branchId) {
  const [summary] = await query(
    `SELECT
       (SELECT COUNT(*) FROM inventory_copies WHERE branch_id = @branchId) AS total_copies,
       (SELECT COUNT(*) FROM inventory_copies WHERE branch_id = @branchId AND copy_status = 'AVAILABLE') AS available_copies,
       (SELECT COUNT(*) FROM reservation_queue WHERE assigned_branch_id = @branchId AND reservation_status = 'QUEUED') AS queue_length,
       (SELECT COUNT(*) FROM quality_checks qc JOIN inventory_copies ic ON ic.copy_id = qc.copy_id WHERE ic.branch_id = @branchId AND qc.updated_condition = 'DAMAGED') AS repair_count,
       (SELECT COUNT(*) FROM branch_transfers WHERE source_branch_id = @branchId OR destination_branch_id = @branchId) AS transfer_count`,
    { branchId }
  );
  const mostBorrowed = await query(
    `SELECT TOP 5 p.title, COUNT(*) AS borrow_count
     FROM borrowing_records br
     JOIN inventory_copies ic ON ic.copy_id = br.copy_id
     JOIN publications p ON p.publication_id = ic.publication_id
     WHERE ic.branch_id = @branchId
     GROUP BY p.title ORDER BY borrow_count DESC`,
    { branchId }
  );
  return { summary, mostBorrowed };
}

export async function ownerAnalytics() {
  const [summary] = await query(
    `SELECT
       (SELECT COUNT(*) FROM branches) AS branches,
       (SELECT COUNT(*) FROM members) AS members,
       (SELECT COUNT(*) FROM inventory_copies) AS copies,
       (SELECT COUNT(*) FROM branch_transfers) AS transfers,
       (SELECT COUNT(*) FROM acquisition_requests WHERE request_status IN ('REQUESTED','UNDER_REVIEW')) AS acquisition_demand`
  );
  const demand = await query(
    `SELECT TOP 10 requested_title, COUNT(*) AS request_count
     FROM acquisition_requests
     GROUP BY requested_title ORDER BY request_count DESC`
  );
  return { summary, demand };
}

export async function updateOwnerSettings(payload) {
  const [settings] = await query(
    `INSERT INTO owner_settings(fine_per_day,premium_membership_cost,standard_membership_cost,standard_hold_hours,premium_hold_hours)
     OUTPUT INSERTED.*
     VALUES(@fine,@premium,@standard,@standardHold,@premiumHold)`,
    {
      fine: payload.fine_per_day,
      premium: payload.premium_membership_cost,
      standard: payload.standard_membership_cost,
      standardHold: payload.standard_hold_hours,
      premiumHold: payload.premium_hold_hours
    }
  );
  return settings;
}

export async function getOwnerSettings() {
  const [settings] = await query('SELECT TOP 1 * FROM owner_settings ORDER BY setting_id DESC');
  return settings || { fine_per_day: 10, premium_membership_cost: 500, standard_membership_cost: 100, standard_hold_hours: 24, premium_hold_hours: 48 };
}


