import { getDbClient } from '../server/db/client';
import { runTursoMigrations } from '../server/db/tursoMigrations';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('[4CETY TURSO] Iniciando conexão e migrações...');
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    console.log('[4CETY TURSO] TURSO_DATABASE_URL não configurada no .env. Executando contra base padrão.');
  } else {
    console.log(`[4CETY TURSO] Configurado para: ${url.replace(/:[^:]*@/, ':***@')}`);
  }

  const client = getDbClient();
  await runTursoMigrations(client);
  console.log('[4CETY TURSO] Migrações executadas com sucesso!');

  const adminCheck = await client.execute('SELECT id, username, created_at FROM admin_users');
  console.log('[4CETY TURSO] Usuários administrativos ativos:', adminCheck.rows);

  const responsesCheck = await client.execute('SELECT COUNT(*) as total FROM survey_responses');
  console.log('[4CETY TURSO] Total de respostas na base:', responsesCheck.rows[0]);
}

main().catch((err) => {
  console.error('[4CETY TURSO] Erro na inicialização:', err);
  process.exit(1);
});
