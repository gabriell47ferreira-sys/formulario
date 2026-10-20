import fs from 'fs';
import path from 'path';
import { getDatabase } from '../server/db/connection';

const dbPath = path.resolve(process.cwd(), process.env.SQLITE_DB_PATH || 'data/cety.sqlite');
const backupPath = path.resolve(process.cwd(), 'data/pre_reset_backup.sqlite');

console.log('[4CETY RESET] Iniciando limpeza de dados de teste...');

// 1. Cria cópia de segurança antes da limpeza
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`[4CETY RESET] Backup de segurança criado em: ${backupPath}`);
}

const db = getDatabase();

// 2. Consulta quantidade atual antes da limpeza
const countResponsesBefore = (db.prepare('SELECT COUNT(*) as count FROM survey_responses').get() as { count: number }).count;
const countDocsBefore = (db.prepare('SELECT COUNT(*) as count FROM stored_documents').get() as { count: number }).count;
const countAdminBefore = (db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number }).count;

console.log(`[4CETY RESET] Estado antes da limpeza:`);
console.log(` - Respostas no banco: ${countResponsesBefore}`);
console.log(` - Documentos no banco: ${countDocsBefore}`);
console.log(` - Usuários administradores: ${countAdminBefore}`);

// 3. Executa a limpeza em transação atômica
db.exec('BEGIN TRANSACTION;');
try {
  db.exec('DELETE FROM stored_documents;');
  db.exec('DELETE FROM survey_responses;');
  db.exec('COMMIT;');
  console.log('[4CETY RESET] Tabela survey_responses e stored_documents esvaziadas com sucesso!');
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('[4CETY RESET] Erro ao limpar tabelas:', err);
  process.exit(1);
}

// 4. Limpa também o arquivo legado data/database.json para evitar reimportação
const legacyJsonPath = path.resolve(process.cwd(), 'data/database.json');
if (fs.existsSync(legacyJsonPath)) {
  fs.writeFileSync(
    legacyJsonPath,
    JSON.stringify({ submissions: {}, reports: {}, resetAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );
  console.log('[4CETY RESET] Arquivo legado data/database.json zerado.');
}

// 5. Limpa pasta de documentos físicos se houver
const docsDir = path.resolve(process.cwd(), 'data/documents');
if (fs.existsSync(docsDir)) {
  const files = fs.readdirSync(docsDir);
  for (const f of files) {
    fs.unlinkSync(path.join(docsDir, f));
  }
  console.log(`[4CETY RESET] ${files.length} arquivos físicos em data/documents removidos.`);
}

// 6. Confirma contagem final
const countResponsesAfter = (db.prepare('SELECT COUNT(*) as count FROM survey_responses').get() as { count: number }).count;
const countAdminAfter = (db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number }).count;

console.log(`[4CETY RESET] Limpeza concluída com sucesso!`);
console.log(` - Respostas restantes: ${countResponsesAfter} (pronto para nova captação)`);
console.log(` - Administradores preservados: ${countAdminAfter}`);
