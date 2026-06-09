import Joi from 'joi';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/http.js';
import * as reservation from '../services/reservationService.js';
import * as borrow from '../services/borrowService.js';
import * as member from '../services/memberService.js';
import * as transfer from '../services/transferService.js';
import * as acquisition from '../services/acquisitionService.js';
import * as notification from '../services/notificationService.js';
import * as reviews from '../services/reviewService.js';
import * as lists from '../services/readingListService.js';

export const schemas = {
  reserve: Joi.object({ publication_id: Joi.number().required(), branch_id: Joi.number().required() }),
  borrow: Joi.object({ publication_id: Joi.number().required(), branch_id: Joi.number().required() }),
  borrowHold: Joi.object({ hold_id: Joi.number().required() }),
  switchBranch: Joi.object({ branch_id: Joi.number().required() }),
  upgrade: Joi.object({ plan_name: Joi.string().valid('STANDARD', 'PREMIUM').required() }),
  transfer: Joi.object({ publication_id: Joi.number().required(), source_branch_id: Joi.number().required() }),
  acquisition: Joi.object({
    title: Joi.string().required(),
    author: Joi.string().required(),
    isbn: Joi.string().allow('', null),
    branch_id: Joi.number().required(),
    priority_level: Joi.string().valid('LOW', 'NORMAL', 'HIGH').default('NORMAL')
  }),
  review: Joi.object({ publication_id: Joi.number().required(), rating_value: Joi.number().min(1).max(5).required(), review_text: Joi.string().allow('', null) }),
  list: Joi.object({ list_name: Joi.string().required(), visibility_status: Joi.string().valid('PRIVATE', 'PUBLIC').default('PRIVATE') }),
  listItem: Joi.object({ publication_id: Joi.number().required() })
};

export const reserveBook = asyncHandler(async (req, res) => created(res, await reservation.reserveBook(req.user.member_id, req.body.publication_id, req.body.branch_id)));
export const cancelReservation = asyncHandler(async (req, res) => ok(res, await reservation.cancelReservation(req.user.member_id, Number(req.params.reservationId))));
export const reservations = asyncHandler(async (req, res) => ok(res, await reservation.listMemberReservations(req.user.member_id)));
export const borrowBook = asyncHandler(async (req, res) => created(res, await borrow.borrowAvailable(req.user.member_id, req.body.publication_id, req.body.branch_id)));
export const borrowHold = asyncHandler(async (req, res) => created(res, await borrow.borrowHold(req.user.member_id, req.body.hold_id)));
export const history = asyncHandler(async (req, res) => ok(res, await borrow.memberHistory(req.user.member_id)));
export const switchBranch = asyncHandler(async (req, res) => ok(res, await member.switchBranch(req.user.member_id, req.body.branch_id)));
export const upgrade = asyncHandler(async (req, res) => ok(res, await member.upgradeMembership(req.user.member_id, req.body.plan_name)));
export const fines = asyncHandler(async (req, res) => ok(res, await member.fines(req.user.member_id)));
export const requestTransfer = asyncHandler(async (req, res) => created(res, await transfer.requestTransfer(req.user.member_id, Number(req.body.publication_id), Number(req.body.source_branch_id))));
export const transfers = asyncHandler(async (req, res) => ok(res, await transfer.listTransfers(null, req.user.member_id)));
export const cancelTransfer = asyncHandler(async (req, res) => ok(res, await transfer.cancelTransfer(req.user.member_id, Number(req.params.transferId))));
export const requestAcquisition = asyncHandler(async (req, res) => created(res, await acquisition.createRequest(req.user.member_id, req.body)));
export const myAcquisitions = asyncHandler(async (req, res) => ok(res, await acquisition.listRequests(req.user.member_id)));
export const updateAcquisition = asyncHandler(async (req, res) => ok(res, await acquisition.updateMemberRequest(req.user.member_id, Number(req.params.requestId), req.body)));
export const cancelAcquisition = asyncHandler(async (req, res) => ok(res, await acquisition.cancelRequest(req.user.member_id, Number(req.params.requestId))));
export const notifications = asyncHandler(async (req, res) => ok(res, await notification.listNotifications(req.user.member_id)));
export const markNotification = asyncHandler(async (req, res) => ok(res, await notification.markRead(req.user.member_id, Number(req.params.notificationId))));
export const review = asyncHandler(async (req, res) => created(res, await reviews.upsertReview(req.user.member_id, req.body)));
export const myReviews = asyncHandler(async (req, res) => ok(res, await reviews.memberReviews(req.user.member_id)));
export const deleteReview = asyncHandler(async (req, res) => ok(res, await reviews.deleteReview(req.user.member_id, Number(req.params.reviewId))));
export const createReadingList = asyncHandler(async (req, res) => created(res, await lists.createList(req.user.member_id, req.body)));
export const updateReadingList = asyncHandler(async (req, res) => ok(res, await lists.updateList(req.user.member_id, Number(req.params.listId), req.body)));
export const addReadingListItem = asyncHandler(async (req, res) => created(res, await lists.addItem(req.user.member_id, Number(req.params.listId), req.body.publication_id)));
export const readingLists = asyncHandler(async (req, res) => ok(res, await lists.lists(req.user.member_id)));
export const deleteReadingList = asyncHandler(async (req, res) => ok(res, await lists.deleteList(req.user.member_id, Number(req.params.listId))));
export const readingListItems = asyncHandler(async (req, res) => ok(res, await lists.items(req.user.member_id, Number(req.params.listId))));
export const removeReadingListItem = asyncHandler(async (req, res) => ok(res, await lists.removeItem(req.user.member_id, Number(req.params.listId), Number(req.params.itemId))));

