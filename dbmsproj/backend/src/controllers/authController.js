import Joi from 'joi';
import { asyncHandler } from '../utils/asyncHandler.js';
import { created, ok } from '../utils/http.js';
import * as auth from '../services/authService.js';

export const schemas = {
  register: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    phone_number: Joi.string().allow('', null),
    branch_id: Joi.number().integer().required(),
    plan_name: Joi.string().valid('STANDARD', 'PREMIUM').default('STANDARD'),
    password: Joi.string().min(8).required()
  }),
  login: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().required(),
    login_type: Joi.string().valid('member', 'admin', 'owner').required()
  }),
  refresh: Joi.object({ refreshToken: Joi.string().required() })
};

export const register = asyncHandler(async (req, res) => created(res, await auth.registerMember(req.body)));
export const login = asyncHandler(async (req, res) => ok(res, await auth.login(req.body)));
export const refresh = asyncHandler(async (req, res) => ok(res, await auth.refresh(req.body.refreshToken)));
export const me = asyncHandler(async (req, res) => ok(res, await auth.me(req.user.account_id)));

