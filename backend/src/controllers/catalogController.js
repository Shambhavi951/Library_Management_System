import Joi from 'joi';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/http.js';
import * as catalog from '../services/catalogService.js';

export const schemas = {
  search: Joi.object({
    q: Joi.string().allow('').default(''),
    branchId: Joi.number().integer().allow(null),
    availableOnly: Joi.boolean().default(false)
  })
};

export const branches = asyncHandler(async (req, res) => ok(res, await catalog.listBranches()));
export const search = asyncHandler(async (req, res) => ok(res, await catalog.searchCatalog(req.query)));
export const details = asyncHandler(async (req, res) => ok(res, await catalog.getBookDetails(Number(req.params.publicationId))));
export const intelligence = asyncHandler(async (req, res) => ok(res, await catalog.branchIntelligence(Number(req.params.publicationId))));

