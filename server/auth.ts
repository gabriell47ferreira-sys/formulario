import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getDbClient } from './db/client';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'cety_default_secure_jwt_secret_key_minimum_32_characters';

export interface AdminPayload {
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

/**
 * Validação de credenciais contra a tabela admin_users persistida no SQLite / Turso
 */
export async function authenticateAdminCredentials(username: string, password: string): Promise<boolean> {
  if (!username || !password) return false;

  const cleanUsername = username.trim().toLowerCase();
  const db = getDbClient();
  const res = await db.execute({
    sql: 'SELECT password_hash FROM admin_users WHERE LOWER(username) = ?',
    args: [cleanUsername],
  });
  const row = res.rows[0] as { password_hash: string } | undefined;

  if (!row || !row.password_hash) {
    // Defesa contra timing attacks: realiza comparação simulada
    bcrypt.compareSync(password, '$2a$10$abcdefghijklmnopqrstuuNOPQRSTUVWXYZabcdefghijklmnopqrstu');
    return false;
  }

  const hash = String(row.password_hash);
  return bcrypt.compareSync(password, hash) || bcrypt.compareSync(password.trim(), hash);
}

/**
 * Alteração segura de senha administrativa com validação e persistência no SQLite / Turso
 */
export async function changeAdminPassword(username: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  if (!username || !currentPassword || !newPassword) {
    return { success: false, message: 'Todos os campos de senha são obrigatórios.' };
  }

  const isValid = await authenticateAdminCredentials(username, currentPassword);
  if (!isValid) {
    return { success: false, message: 'Senha atual incorreta.' };
  }

  if (newPassword.length < 8) {
    return { success: false, message: 'A nova senha deve possuir no mínimo 8 caracteres.' };
  }

  const db = getDbClient();
  const newHash = bcrypt.hashSync(newPassword, 10);
  const now = new Date().toISOString();

  await db.execute({
    sql: 'UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE LOWER(username) = ?',
    args: [newHash, now, username.trim().toLowerCase()],
  });
  return { success: true, message: 'Senha administrativa atualizada com sucesso.' };
}

export function generateAdminToken(username: string): string {
  const payload: AdminPayload = {
    username,
    role: 'admin',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

/**
 * Extrai cookies do cabeçalho da requisição sem dependência externa
 */
function parseCookies(req: Request): Record<string, string> {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.substring(0, idx).trim();
      const val = pair.substring(idx + 1).trim();
      try {
        acc[key] = decodeURIComponent(val);
      } catch {
        acc[key] = val;
      }
    }
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Middleware de autorização segura para o backend (suporta Bearer Header e Cookie HttpOnly)
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // 1. Tenta obter token pelo cabeçalho Authorization Bearer
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Se não houver no header, tenta obter pelo cookie HttpOnly cety_admin_token
  if (!token) {
    const cookies = parseCookies(req);
    token = cookies['cety_admin_token'];
  }

  if (!token) {
    res.status(401).json({
      error: 'Não autorizado',
      message: 'Sessão administrativa ausente ou não autenticada. Acesso negado.',
    });
    return;
  }

  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== 'admin') {
    res.status(403).json({
      error: 'Proibido',
      message: 'Sessão administrativa inválida ou expirada. Faça login novamente.',
    });
    return;
  }

  // Anexa o usuário autenticado à requisição
  (req as any).adminUser = payload;
  next();
}
