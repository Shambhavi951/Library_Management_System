import { query } from '../database/db.js';
import { badRequest, notFound } from '../utils/errors.js';
import { notify } from './notificationService.js';

export async function requestTransfer(memberId, copyId, destinationBranchId) {
  const [copy] = await query(
    `SELECT ic.*, p.title FROM inventory_copies ic 
     JOIN publications p ON p.publication_id = ic.publication_id
     WHERE ic.copy_id = @copyId`, 
    { copyId }
  );
  if (!copy) throw notFound('Copy not found');
  if (Number(copy.branch_id) === Number(destinationBranchId)) throw badRequest('Copy is already at that branch');
  if (!['AVAILABLE'].includes(copy.copy_status)) throw badRequest('Only available copies can be transferred');
  const [active] = await query(
    `SELECT TOP 1 transfer_id FROM branch_transfers
     WHERE copy_id = @copyId AND transfer_status IN ('REQUESTED','APPROVED','IN_TRANSIT','ARRIVED','READY_FOR_PICKUP')`,
    { copyId }
  );
  if (active) throw badRequest('This copy already has an active transfer');
  const [transfer] = await query(
    `INSERT INTO branch_transfers(copy_id, source_branch_id, destination_branch_id, transfer_status, requested_date, requested_by_member_id)
     OUTPUT INSERTED.*
     VALUES(@copyId,@source,@destination,'REQUESTED',GETDATE(),@memberId)`,
    { copyId, source: copy.branch_id, destination: destinationBranchId, memberId }
  );
  await notify(memberId, 'TRANSFER_REQUESTED', 'Transfer requested', 'Your cross-branch transfer request was recorded.');
  
  await notify(null, 'TRANSFER_OUT_REQUESTED', 'Transfer Request Out', `Copy of "${copy.title}" has been requested for transfer to another branch.`, copy.branch_id);
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
