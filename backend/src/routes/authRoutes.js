import { Router } from 'express';
import * as controller from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';

export const authRouter = Router();
authRouter.post('/register', authenticate, requireRole('ADMIN', 'OWNER'), validate(controller.schemas.register), controller.register);
authRouter.post('/login', validate(controller.schemas.login), controller.login);
authRouter.post('/refresh', validate(controller.schemas.refresh), controller.refresh);
authRouter.get('/me', authenticate, controller.me);
authRouter.post('/logout', authenticate, (req, res) => res.json({ data: { loggedOut: true } }));

