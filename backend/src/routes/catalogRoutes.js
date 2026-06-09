import { Router } from 'express';
import * as controller from '../controllers/catalogController.js';
import { validate } from '../middleware/validate.js';

export const catalogRouter = Router();
catalogRouter.get('/branches', controller.branches);
catalogRouter.get('/books', validate(controller.schemas.search, 'query'), controller.search);
catalogRouter.get('/books/:publicationId', controller.details);
catalogRouter.get('/books/:publicationId/intelligence', controller.intelligence);

