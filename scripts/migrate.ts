import { runMigrations } from '../server/db/migrations';
import { getDatabasePath } from '../server/db/connection';

console.log('--- EXECUTANDO MIGRAÇÕES DO BANCO DE DADOS 4CETY ---');
console.log(`Arquivo do Banco: ${getDatabasePath()}`);

try {
  runMigrations();
  console.log('✓ Migrações verificadas e aplicadas com sucesso!');
  process.exit(0);
} catch (error) {
  console.error('❌ Erro na execução das migrações:', error);
  process.exit(1);
}
