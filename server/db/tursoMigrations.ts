import { Client } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { getDbClient } from './client';

export async function runTursoMigrations(client?: Client): Promise<void> {
  const db = client || getDbClient();

  // 1. Tabela de controle de migrações
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // 2. Tabela survey_responses
  await db.execute(`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id TEXT PRIMARY KEY,
      practice_area TEXT NOT NULL,
      team_size TEXT NOT NULL,
      caseload TEXT NOT NULL,
      current_tools TEXT,
      deadline_management TEXT,
      main_pain_point TEXT,
      time_consuming_tasks TEXT,
      desired_automation TEXT,
      desired_ai_features TEXT,
      morning_dashboard TEXT,
      task_to_eliminate TEXT,
      status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK(status IN ('PENDENTE', 'ANALISADO', 'ERRO_ANALISE')),
      report_id TEXT,
      report_data TEXT,
      is_test_data INTEGER NOT NULL DEFAULT 0,
      test_profile_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_survey_responses_status ON survey_responses(status);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_survey_responses_area ON survey_responses(practice_area);`);

  // 3. Tabela stored_documents
  await db.execute(`
    CREATE TABLE IF NOT EXISTS stored_documents (
      id TEXT PRIMARY KEY,
      response_id TEXT,
      original_filename TEXT NOT NULL,
      storage_filename TEXT NOT NULL UNIQUE,
      relative_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_stored_documents_response_id ON stored_documents(response_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_stored_documents_created_at ON stored_documents(created_at);`);

  // 4. Tabela admin_users
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);`);

  // 5. Inicialização controlada do administrador inicial (se a tabela admin_users estiver vazia)
  const countRes = await db.execute('SELECT COUNT(*) as count FROM admin_users');
  const count = Number(countRes.rows[0]?.count || 0);

  if (count === 0) {
    const initialUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const initialRawPassword = process.env.ADMIN_PASSWORD || 'admin47';
    const passwordHash = bcrypt.hashSync(initialRawPassword, 10);
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO admin_users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      args: ['ADMIN-ROOT-001', initialUsername, passwordHash, now, now],
    });
    console.log(`[4CETY DB] Usuário administrativo "${initialUsername}" provisionado com sucesso na base.`);
  }
}
