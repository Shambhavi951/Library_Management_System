import { Router } from 'express';
import * as controller from '../controllers/ownerController.js';
import * as adminController from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';

export const ownerRouter = Router();
ownerRouter.use(authenticate);

ownerRouter.get('/settings', requireRole('OWNER', 'ADMIN'), controller.getSettings);
ownerRouter.post('/settings', requireRole('OWNER'), validate(controller.schemas.settings), controller.settings);
ownerRouter.get('/notifications', requireRole('OWNER'), controller.notifications);
ownerRouter.patch('/notifications/:notificationId/read', requireRole('OWNER'), controller.markNotification);

ownerRouter.get('/analytics', requireRole('OWNER'), controller.analyticsDashboard);
ownerRouter.get('/admins', requireRole('OWNER'), controller.admins);
ownerRouter.post('/admins', requireRole('OWNER'), validate(controller.schemas.admin), controller.createAdmin);
ownerRouter.put('/admins/:accountId', requireRole('OWNER'), validate(controller.schemas.editAdmin), controller.editAdmin);
ownerRouter.delete('/admins/:accountId', requireRole('OWNER'), controller.deactivateAdmin);
ownerRouter.post('/branches', requireRole('OWNER'), validate(controller.schemas.branch), controller.createBranch);
ownerRouter.delete('/branches/:branchId', requireRole('OWNER'), controller.deactivateBranch);

// Members CRUD for Owner
ownerRouter.get('/members', requireRole('OWNER'), adminController.membersList);
ownerRouter.post('/members', requireRole('OWNER'), validate(adminController.schemas.member), adminController.createMember);
ownerRouter.put('/members/:memberId', requireRole('OWNER'), validate(adminController.schemas.member), adminController.updateMember);
ownerRouter.delete('/members/:memberId', requireRole('OWNER'), adminController.deactivateMember);
