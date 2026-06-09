import { query } from '../database/db.js';
import { badRequest, notFound } from '../utils/errors.js';
import { notify } from './notificationService.js';

export async function createRequest(memberId, payload) {
  const [request] = await query(
    `INSERT INTO acquisition_requests(member_id, requested_title, requested_author, requested_isbn, preferred_branch_id, priority_level, request_status)
     OUTPUT INSERTED.*
     VALUES(@memberId,@title,@author,@isbn,@branchId,@priority,'REQUESTED')`,
    {
      memberId,
      title: payload.title,
      author: payload.author,
      isbn: payload.isbn || null,
      branchId: payload.branch_id,
      priority: payload.priority_level || 'NORMAL'
    }
  );
  await notify(null, 'NEW_ACQUISITION_REQUEST', 'New Acquisition Request', `A new title "${request.requested_title}" has been requested for your branch.`, request.preferred_branch_id);
  return request;
}

export async function updateRequestStatus(requestId, status) {
  const [request] = await query(
    `UPDATE acquisition_requests SET request_status = @status
     OUTPUT INSERTED.*
     WHERE acquisition_request_id = @requestId`,
    { requestId, status }
  );
  let notificationType = 'ACQUISITION_UPDATE';
  let title = 'Acquisition Request Update';
  let message = `Your request for "${request.requested_title}" has been updated to "${status}".`;

  if (status === 'AVAILABLE') {
    notificationType = 'REQUESTED_BOOK_AVAILABLE';
    title = 'Requested title available';
    message = `"${request.requested_title}" is now available at the library!`;
  } else if (status === 'REJECTED') {
    notificationType = 'REQUESTED_BOOK_REJECTED';
    title = 'Requested title rejected';
    message = `Unfortunately, your request for "${request.requested_title}" was rejected.`;
  }
  await notify(request.member_id, notificationType, title, message);
  return request;
}

export async function cancelRequest(memberId, requestId) {
  const [request] = await query(
    `SELECT * FROM acquisition_requests
     WHERE acquisition_request_id = @requestId AND member_id = @memberId`,
    { requestId, memberId }
  );
  if (!request) throw notFound('Acquisition request not found');
  if (!['REQUESTED', 'UNDER_REVIEW'].includes(request.request_status)) {
    throw badRequest('Only requested or under-review acquisitions can be canceled');
  }
  const [updated] = await query(
    `UPDATE acquisition_requests SET request_status = 'CANCELED'
     OUTPUT INSERTED.*
     WHERE acquisition_request_id = @requestId`,
    { requestId }
  );
  return updated;
}

export async function updateMemberRequest(memberId, requestId, payload) {
  const [request] = await query(
    `SELECT * FROM acquisition_requests
     WHERE acquisition_request_id = @requestId AND member_id = @memberId`,
    { requestId, memberId }
  );
  if (!request) throw notFound('Acquisition request not found');
  if (!['REQUESTED', 'UNDER_REVIEW'].includes(request.request_status)) {
    throw badRequest('Only requested or under-review acquisitions can be updated');
  }
  const [updated] = await query(
    `UPDATE acquisition_requests
     SET requested_title = @title,
         requested_author = @author,
         requested_isbn = @isbn,
         preferred_branch_id = @branchId,
         priority_level = @priority
     OUTPUT INSERTED.*
     WHERE acquisition_request_id = @requestId`,
    {
      requestId,
      title: payload.title,
      author: payload.author,
      isbn: payload.isbn || null,
      branchId: payload.branch_id,
      priority: payload.priority_level || 'NORMAL'
    }
  );
  return updated;
}

export async function listRequests(memberId = null, branchId = null) {
  return query(
    `SELECT ar.*, ar.preferred_branch_id AS branch_id, b.branch_name, CONCAT(m.first_name,' ',m.last_name) AS requester
     FROM acquisition_requests ar
     LEFT JOIN branches b ON b.branch_id = ar.preferred_branch_id
     LEFT JOIN members m ON m.member_id = ar.member_id
     WHERE (@memberId IS NULL OR ar.member_id = @memberId)
       AND (@branchId IS NULL OR ar.preferred_branch_id = @branchId)
     ORDER BY ar.acquisition_request_id DESC`,
    { memberId, branchId }
  );
}
