import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let clientInstance: Client | null = null;

export function getDbClient(): Client {
  if (clientInstance) {
    return clientInstance;
  }

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // 1. Conexão com a Nuvem Turso (quando configurado na Vercel ou .env)
  if (tursoUrl && tursoUrl.trim() !== '') {
    console.log(`[4CETY DB] Conectando ao banco Turso em nuvem: ${tursoUrl.replace(/:[^:]*@/, ':***@')}`);
    clientInstance = createClient({
      url: tursoUrl.trim(),
      authToken: tursoToken?.trim(),
    });
    return clientInstance;
  }

  // 2. Conexão Local SQLite
  const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
  let localDbPath: string;

  if (isVercel) {
    // No ambiente Serverless da Vercel sem Turso, utiliza o diretório /tmp gravável
    localDbPath = path.resolve('/tmp', 'cety.sqlite');
  } else {
    const configuredPath = process.env.CETY_DB_PATH || 'data/cety.sqlite';
    localDbPath = path.resolve(process.cwd(), configuredPath);
    const dir = path.dirname(localDbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  console.log(`[4CETY DB] Conectando ao SQLite local: ${localDbPath}`);
  clientInstance = createClient({
    url: `file:${localDbPath.replace(/\\/g, '/')}`,
  });

  return clientInstance;
}
