import bcrypt from 'bcryptjs';

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return { hash: await bcrypt.hash(password, salt), salt };
}

export function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

