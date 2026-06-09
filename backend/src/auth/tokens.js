import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(account) {
  return jwt.sign(
    {
      sub: account.account_id,
      role: account.role_type,
      memberId: account.member_id,
      branchId: account.branch_id,
      username: account.username
    },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpires }
  );
}

export function signRefreshToken(account) {
  return jwt.sign({ sub: account.account_id, role: account.role_type }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpires
  });
}

export function verifyAccess(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefresh(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

