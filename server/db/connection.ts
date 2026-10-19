import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let dbInstance: DatabaseSync | null = null;

export function getDatabasePath(): string {
  const envPath = process.env.CETY_DB_PATH || 'data/cety.sqlite';
  return path.resolve(process.cwd(), envPath);
}

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  const dbDir = path.dirname(dbPath);

  // Garante que o diretório onde o arquivo SQLite residirá exista
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Abre conexão com o arquivo SQLite local
  dbInstance = new DatabaseSync(dbPath);

  // Configurações cruciais de integridade e desempenho
  // 1. Integridade referencial ativada obrigatoriamente
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  // 2. WAL mode para alta concorrência e resiliência contra quedas
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  // 3. Busy timeout para prevenir conflitos de concorrência
  dbInstance.exec('PRAGMA busy_timeout = 5000;');

  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      console.warn('Aviso ao fechar conexão SQLite:', e);
    }
    dbInstance = null;
  }
}
