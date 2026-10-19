import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './connection';
import fs from 'fs';
import path from 'path';
import { TEST_PROFILES } from '../../src/data/mockData';
import { generateStrategicReport } from '../../src/services/reportEngine';

interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseSync) => void;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: '001_initial_schema_survey_and_documents',
    up: (db: DatabaseSync) => {
      // 1. Tabela survey_responses
      db.exec(`
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

        CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at);
        CREATE INDEX IF NOT EXISTS idx_survey_responses_status ON survey_responses(status);
        CREATE INDEX IF NOT EXISTS idx_survey_responses_area ON survey_responses(practice_area);
      `);

      // 2. Tabela stored_documents
      db.exec(`
        CREATE TABLE IF NOT EXISTS stored_documents (
          id TEXT PRIMARY KEY,
          response_id TEXT REFERENCES survey_responses(id) ON DELETE SET NULL,
          original_filename TEXT NOT NULL,
          storage_filename TEXT NOT NULL UNIQUE,
          relative_path TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          sha256 TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_stored_documents_response_id ON stored_documents(response_id);
        CREATE INDEX IF NOT EXISTS idx_stored_documents_sha256 ON stored_documents(sha256);
        CREATE INDEX IF NOT EXISTS idx_stored_documents_created_at ON stored_documents(created_at);
      `);
    },
  },
];

export function runMigrations(db?: DatabaseSync): void {
  const database = db || getDatabase();

  // Criação da tabela de controle de migrações
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // Consulta migrações já executadas
  const rows = database.prepare('SELECT version FROM schema_migrations ORDER BY version ASC').all() as { version: number }[];
  const appliedVersions = new Set(rows.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`[4CETY DB] Aplicando migração ${migration.version}: ${migration.name}...`);
      
      // Executa a migração em transação
      database.exec('BEGIN TRANSACTION;');
      try {
        migration.up(database);
        const insertStmt = database.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)');
        insertStmt.run(migration.version, migration.name, new Date().toISOString());
        database.exec('COMMIT;');
        console.log(`[4CETY DB] Migração ${migration.version} aplicada com sucesso.`);
      } catch (err) {
        database.exec('ROLLBACK;');
        console.error(`[4CETY DB] Falha fatal ao aplicar migração ${migration.version}:`, err);
        throw err;
      }
    }
  }

  // Se a tabela estiver vazia, importa dados legados do database.json ou semeia perfis de teste
  seedInitialDataIfEmpty(database);
}

function seedInitialDataIfEmpty(db: DatabaseSync): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM survey_responses').get() as { count: number };
  if (countRow.count > 0) {
    return;
  }

  // Verifica se existe o arquivo legado database.json para migrar
  const legacyFile = path.resolve(process.cwd(), 'data/database.json');
  if (fs.existsSync(legacyFile)) {
    try {
      const raw = fs.readFileSync(legacyFile, 'utf-8');
      const legacyData = JSON.parse(raw);
      if (legacyData.submissions && Object.keys(legacyData.submissions).length > 0) {
        console.log('[4CETY DB] Migrando submissões legadas do database.json para o SQLite...');
        const insertStmt = db.prepare(`
          INSERT INTO survey_responses (
            id, practice_area, team_size, caseload, current_tools, deadline_management,
            main_pain_point, time_consuming_tasks, desired_automation, desired_ai_features,
            morning_dashboard, task_to_eliminate, status, report_id, report_data,
            is_test_data, test_profile_name, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        db.exec('BEGIN TRANSACTION;');
        for (const [subId, sub] of Object.entries<any>(legacyData.submissions)) {
          const report = legacyData.reports ? legacyData.reports[subId] : null;
          const a = sub.answers || {};
          const area = a.area === 'Outra' && a.areaOther ? `Outra (${a.areaOther})` : (a.area || 'Não informado');

          insertStmt.run(
            sub.id || subId,
            area,
            a.teamStructure || 'Não informado',
            a.processVolume || 'Não informado',
            a.toolsUsed || '',
            a.operationalControl || '',
            a.mainDifficulties || '',
            JSON.stringify(a.timeSinks || []),
            a.desiredAutomation || '',
            JSON.stringify(a.aiCapabilities || []),
            a.idealDashboard || '',
            a.singleTaskToEliminate || '',
            sub.status || 'ANALISADO',
            sub.reportId || (report ? report.id : null),
            report ? JSON.stringify(report) : null,
            sub.isTestData ? 1 : 0,
            sub.testProfileName || null,
            sub.createdAt || new Date().toISOString(),
            sub.createdAt || new Date().toISOString()
          );
        }
        db.exec('COMMIT;');
        console.log('[4CETY DB] Submissões legadas migradas com sucesso para SQLite!');
        return;
      }
    } catch (e) {
      console.warn('[4CETY DB] Não foi possível migrar database.json legado:', e);
    }
  }

  // Caso não haja dados legados, insere os perfis de teste demonstrativos iniciais
  console.log('[4CETY DB] Semeando perfis de teste iniciais no SQLite...');
  const insertStmt = db.prepare(`
    INSERT INTO survey_responses (
      id, practice_area, team_size, caseload, current_tools, deadline_management,
      main_pain_point, time_consuming_tasks, desired_automation, desired_ai_features,
      morning_dashboard, task_to_eliminate, status, report_id, report_data,
      is_test_data, test_profile_name, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION;');
  TEST_PROFILES.forEach((profile, idx) => {
    const subId = `SUB-TESTE-00${idx + 1}`;
    const report = generateStrategicReport(profile.answers);
    const a = profile.answers;
    const createdAt = new Date(Date.now() - (3 - idx) * 3600000 * 24).toISOString();

    insertStmt.run(
      subId,
      a.area || 'Não informado',
      a.teamStructure || 'Não informado',
      a.processVolume || 'Não informado',
      a.toolsUsed || '',
      a.operationalControl || '',
      a.mainDifficulties || '',
      JSON.stringify(a.timeSinks || []),
      a.desiredAutomation || '',
      JSON.stringify(a.aiCapabilities || []),
      a.idealDashboard || '',
      a.singleTaskToEliminate || '',
      'ANALISADO',
      report.id,
      JSON.stringify(report),
      1,
      profile.name,
      createdAt,
      createdAt
    );
  });
  db.exec('COMMIT;');
  console.log('[4CETY DB] 3 perfis de teste semeados com sucesso!');
}
