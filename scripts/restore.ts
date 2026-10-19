import { BackupService } from '../server/services/backupService';
import path from 'path';

const targetBackup = process.argv[2];

if (!targetBackup) {
  console.error('Uso: npx tsx scripts/restore.ts <caminho_do_diretorio_de_backup>');
  console.log('Exemplo: npx tsx scripts/restore.ts backups/backup-2026-10-19T18-00-00');
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), targetBackup);
console.log(`--- INICIANDO RESTAURAÇÃO A PARTIR DE: ${resolvedPath} ---`);

try {
  const result = BackupService.restoreBackup(resolvedPath);
  console.log(`\n✓ Restauração concluída com sucesso!`);
  console.log(`  Documentos restaurados: ${result.restoredDocuments}`);
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro durante a restauração do backup:', error);
  process.exit(1);
}
