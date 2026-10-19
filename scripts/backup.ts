import { BackupService } from '../server/services/backupService';

console.log('--- INICIANDO ROTINA DE BACKUP LOCAL 4CETY ---');
try {
  const result = BackupService.createBackup();
  console.log(`\n✓ Backup gerado com sucesso!`);
  console.log(`  Pasta: ${result.backupPath}`);
  console.log(`  Timestamp: ${result.manifest.timestamp}`);
  console.log(`  Hash SHA-256 do Banco: ${result.manifest.db_sha256}`);
  console.log(`  Tamanho do Banco: ${(result.manifest.db_size_bytes / 1024).toFixed(2)} KB`);
  console.log(`  Documentos PDF incluídos: ${result.manifest.documents_count}`);
  console.log('\nGuarde este backup em local seguro ou unidade externa secundária.');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro fatal durante a rotina de backup:', error);
  process.exit(1);
}
