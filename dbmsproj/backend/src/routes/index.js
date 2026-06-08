import { Router } from 'express';
import { authRouter } from './authRoutes.js';
import { catalogRouter } from './catalogRoutes.js';
import { memberRouter } from './memberRoutes.js';
import { adminRouter } from './adminRoutes.js';
import { ownerRouter } from './ownerRoutes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/catalog', catalogRouter);
apiRouter.use('/member', memberRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/owner', ownerRouter);

