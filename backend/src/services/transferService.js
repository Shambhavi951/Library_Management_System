import { query } from '../database/db.js';
import { badRequest, notFound } from '../utils/errors.js';
import { notify } from './notificationService.js';

export async function requestTransfer(memberId, publicationId, sourceBranchId) {
  // 1. Check member plan and active branch
  const [member] = await query(
    `SELECT mp.plan_name, ua.branch_id AS active_branch_id
     FROM members m 
     JOIN membership_plans mp ON mp.membership_plan_id = m.membership_plan_id
     JOIN user_accounts ua ON ua.member_id = m.member_id
     WHERE m.member_id = @memberId`,
    { memberId }
  );
  if (!member) throw notFound('Member not found');
  if (member.plan_name === 'STANDARD') {
    throw badRequest('Only Premium members are allowed to request cross-branch transfers');
  }

  const destinationBranchId = member.active_branch_id;
  if (!destinationBranchId) throw badRequest('No active branch set for your account');
  if (Number(sourceBranchId) === Number(destinationBranchId)) {
    throw badRequest('Cannot transfer within the same branch. Source and destination branches are the same.');
  }

  // 2. Find first available copy at source branch
  const [copy] = await query(
    `SELECT ic.copy_id, p.title 
     FROM inventory_copies ic
     JOIN publications p ON p.publication_id = ic.publication_id
     WHERE ic.publication_id = @publicationId 
       AND ic.branch_id = @sourceBranchId 
       AND ic.copy_status = 'AVAILABLE'
       AND NOT EXISTS (
         SELECT 1 FROM branch_transfers bt 
         WHERE bt.copy_id = ic.copy_id 
           AND bt.transfer_status IN ('REQUESTED','APPROVED','IN_TRANSIT','ARRIVED','READY_FOR_PICKUP')
       )
     LIMIT 1`,
    { publicationId, sourceBranchId }
  );
  if (!copy) {
    throw badRequest('No available copies of this book are currently available at the selected source branch.');
  }

  const copyId = copy.copy_id;

  // 3. Insert transfer record
  const [transfer] = await query(
    `INSERT INTO branch_transfers(copy_id, source_branch_id, destination_branch_id, transfer_status, requested_date, requested_by_member_id)
     OUTPUT INSERTED.*
     VALUES(@copyId,@sourceBranchId,@destinationBranchId,'REQUESTED',NOW(),@memberId)`,
    { copyId, sourceBranchId, destinationBranchId, memberId }
  );

  await notify(memberId, 'TRANSFER_REQUESTED', 'Transfer requested', `Transfer request for "${copy.title}" was recorded.`);
  await notify(null, 'TRANSFER_OUT_REQUESTED', 'Transfer Request Out', `Copy of "${copy.title}" has been requested for transfer to another branch.`, sourceBranchId);
  await notify(null, 'TRANSFER_IN_REQUESTED', 'Incoming Transfer Request', `Copy of "${copy.title}" is requested to be transferred to your branch.`, destinationBranchId);

  return transfer;
}

export async function updateTransfer(transferId, status, adminBranchId) {
  const [transfer] = await query('SELECT * FROM branch_transfers WHERE transfer_id = @transferId', { transferId });
  if (!transfer) throw notFound('Transfer not found');
  if (adminBranchId && ![transfer.source_branch_id, transfer.destination_branch_id].includes(Number(adminBranchId))) {
    throw badRequest('Admins can only process transfers touching their branch');
  }
  assertTransferProgression(transfer.transfer_status, status);
  const arrival = status === 'ARRIVED' ? ', arrival_date = GETDATE()' : '';
  const [updated] = await query(
    `UPDATE branch_transfers SET transfer_status = @status ${arrival}
     OUTPUT INSERTED.* WHERE transfer_id = @transferId`,
    { transferId, status }
  );
  if (status === 'SHELVED' || status === 'READY_FOR_PICKUP') {
    await query('UPDATE inventory_copies SET branch_id = @branchId, copy_status = @copyStatus WHERE copy_id = @copyId', {
      branchId: transfer.destination_branch_id,
      copyStatus: status === 'READY_FOR_PICKUP' ? 'ON_HOLD' : 'AVAILABLE',
      copyId: transfer.copy_id
    });
  }
  return updated;
}

export async function cancelTransfer(memberId, transferId) {
  const [transfer] = await query(
    `SELECT t.* FROM branch_transfers t
     WHERE t.transfer_id = @transferId AND t.requested_by_member_id = @memberId`,
    { transferId, memberId }
  );
  if (!transfer) throw notFound('Transfer not found');
  if (!['REQUESTED', 'APPROVED'].includes(transfer.transfer_status)) {
    throw badRequest('Only requested or approved transfers can be canceled');
  }
  const [updated] = await query(
    `UPDATE branch_transfers SET transfer_status = 'CANCELED'
     OUTPUT INSERTED.*
     WHERE transfer_id = @transferId`,
    { transferId }
  );
  await notify(memberId, 'TRANSFER_CANCELED', 'Transfer canceled', 'Your transfer request was canceled.');
  return updated;
}

export async function listTransfers(branchId = null, memberId = null) {
  return query(
    `SELECT t.*, p.title, sb.branch_name AS source_branch, db.branch_name AS destination_branch
     FROM branch_transfers t
     JOIN inventory_copies ic ON ic.copy_id = t.copy_id
     JOIN publications p ON p.publication_id = ic.publication_id
     JOIN branches sb ON sb.branch_id = t.source_branch_id
     JOIN branches db ON db.branch_id = t.destination_branch_id
     WHERE (CAST(@branchId AS INT) IS NULL OR t.source_branch_id = CAST(@branchId AS INT) OR t.destination_branch_id = CAST(@branchId AS INT))
       AND (CAST(@memberId AS INT) IS NULL OR t.requested_by_member_id = CAST(@memberId AS INT))
     ORDER BY t.requested_date DESC`,
    { branchId, memberId }
  );
}

function assertTransferProgression(current, next) {
  const allowed = {
    REQUESTED: ['APPROVED', 'CANCELED'],
    APPROVED: ['IN_TRANSIT', 'CANCELED'],
    IN_TRANSIT: ['ARRIVED'],
    ARRIVED: ['SHELVED', 'READY_FOR_PICKUP'],
    READY_FOR_PICKUP: ['SHELVED'],
    SHELVED: [],
    CANCELED: []
  };
  if (current === next) return;
  if (!allowed[current]?.includes(next)) {
    throw badRequest(`Cannot move transfer from ${current} to ${next}`);
  }
}
