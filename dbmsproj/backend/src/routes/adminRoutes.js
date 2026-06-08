import { Router } from 'express';
import * as controller from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('ADMIN', 'OWNER'));
adminRouter.get('/inventory', controller.inventoryList);
adminRouter.get('/publications', controller.publicationsList);
adminRouter.post('/publications', validate(controller.schemas.publication), controller.addPublication);
adminRouter.post('/copies', validate(controller.schemas.copy), controller.addCopy);
adminRouter.patch('/copies/:copyId', validate(controller.schemas.copyPatch), controller.updateCopy);
adminRouter.post('/returns', validate(controller.schemas.returnBook), controller.returnBook);
adminRouter.post('/quality-checks', validate(controller.schemas.quality), controller.qualityCheck);
adminRouter.get('/quality-checks', controller.inventoryList);
adminRouter.get('/transfers', controller.transfersList);
adminRouter.patch('/transfers/:transferId', validate(controller.schemas.transfer), controller.updateTransfer);
adminRouter.get('/acquisitions', controller.acquisitionList);
adminRouter.patch('/acquisitions/:requestId', validate(controller.schemas.acquisition), controller.updateAcquisition);
adminRouter.get('/analytics', controller.analyticsDashboard);
adminRouter.get('/notifications', controller.notifications);
adminRouter.post('/approve-hold', validate(controller.schemas.approveHold), controller.approveHold);

// Member CRUD for Admin
adminRouter.get('/members', controller.membersList);
adminRouter.post('/members', validate(controller.schemas.member), controller.createMember);
adminRouter.put('/members/:memberId', validate(controller.schemas.member), controller.updateMember);


