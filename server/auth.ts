import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity_default_secure_jwt_secret_2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const RAW_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@Juridico2026!';

// Gera o hash do password padrão em tempo de inicialização
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(RAW_ADMIN_PASSWORD, 10);

export interface AdminPayload {
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
}

export function authenticateAdminCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;
  if (username !== ADMIN_USERNAME) return false;
  return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
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

// Middleware de autorização segura para o backend
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Não autorizado',
      message: 'Token de administrador ausente. Acesso negado.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
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
