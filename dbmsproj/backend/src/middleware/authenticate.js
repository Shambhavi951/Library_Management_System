import { verifyAccess } from '../auth/tokens.js';
import { query } from '../database/db.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Missing token' } });
    const payload = verifyAccess(token);
    const [account] = await query(
      `SELECT account_id, username, email, role_type, member_id, branch_id, active_status
       FROM user_accounts WHERE account_id = @accountId AND active_status = 'Y'`,
      { accountId: payload.sub }
    );
    if (!account) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Session is no longer valid' } });
    req.user = account;
    next();
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Invalid or expired token' } });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role_type)) {
      return res.status(403).json({ error: { code: 'ROLE_FORBIDDEN', message: 'Role does not match this area' } });
    }
    next();
  };
}

export function requireBranchAccess(paramName = 'branchId') {
  return (req, res, next) => {
    if (req.user.role_type === 'OWNER') return next();
    const requested = Number(req.params[paramName] || req.body.branch_id || req.query.branchId);
    if (req.user.role_type === 'ADMIN' && requested && requested !== Number(req.user.branch_id)) {
      return res.status(403).json({ error: { code: 'BRANCH_FORBIDDEN', message: 'Admins can only manage their assigned branch' } });
    }
    next();
  };
}

