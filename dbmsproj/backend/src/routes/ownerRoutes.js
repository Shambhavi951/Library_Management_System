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

ownerRouter.get('/analytics', requireRole('OWNER'), controller.analyticsDashboard);
ownerRouter.get('/admins', requireRole('OWNER'), controller.admins);
ownerRouter.post('/admins', requireRole('OWNER'), validate(controller.schemas.admin), controller.createAdmin);
ownerRouter.put('/admins/:accountId', requireRole('OWNER'), validate(controller.schemas.editAdmin), controller.editAdmin);
ownerRouter.post('/branches', requireRole('OWNER'), validate(controller.schemas.branch), controller.createBranch);

// Members CRUD for Owner
ownerRouter.get('/members', requireRole('OWNER'), adminController.membersList);
ownerRouter.post('/members', requireRole('OWNER'), validate(adminController.schemas.member), adminController.createMember);
ownerRouter.put('/members/:memberId', requireRole('OWNER'), validate(adminController.schemas.member), adminController.updateMember);

