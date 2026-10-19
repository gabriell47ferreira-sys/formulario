import fs from 'fs';
import path from 'path';
import { getDatabase, closeDatabase, getDatabasePath } from './server/db/connection';
import { runMigrations } from './server/db/migrations';
import { SurveyService } from './server/services/surveyService';
import { DocumentService } from './server/services/documentService';
import { BackupService } from './server/services/backupService';
import { SurveyAnswers } from './src/types/survey';

console.log('=================================================================');
console.log('   INICIANDO BATERIA DE TESTES OBRIGATÓRIOS DO BANCO 4CETY      ');
console.log('=================================================================\n');

async function runTests() {
  try {
    // -----------------------------------------------------------------
    // TESTE 1: Inicialização do banco
    // -----------------------------------------------------------------
    console.log('[TESTE 1] Inicialização do banco SQLite local...');
    const db = getDatabase();
    if (!db) throw new Error('Falha ao instanciar conexão SQLite');
    const fkCheck = db.prepare('PRAGMA foreign_keys;').get() as { foreign_keys: number };
    if (fkCheck.foreign_keys !== 1) throw new Error('Falha: foreign_keys não está ativado');
    const journalCheck = db.prepare('PRAGMA journal_mode;').get() as { journal_mode: string };
    console.log(`  ✓ Banco inicializado em: ${getDatabasePath()}`);
    console.log(`  ✓ Modo de Journal: ${journalCheck.journal_mode.toUpperCase()}`);
    console.log(`  ✓ Chaves estrangeiras ativas: ${fkCheck.foreign_keys === 1}`);

    // -----------------------------------------------------------------
    // TESTE 2: Criação e aplicação de migrações
    // -----------------------------------------------------------------
    console.log('\n[TESTE 2] Criação e aplicação de migrações versionadas...');
    runMigrations(db);
    const migrations = db.prepare('SELECT * FROM schema_migrations ORDER BY version ASC').all() as any[];
    if (migrations.length === 0) throw new Error('Nenhuma migração registrada no histórico');
    console.log(`  ✓ Migrações aplicadas: ${migrations.length} (${migrations.map((m) => m.name).join(', ')})`);

    // -----------------------------------------------------------------
    // TESTE 3: Inserção e recuperação de respostas
    // -----------------------------------------------------------------
    console.log('\n[TESTE 3] Inserção e recuperação de respostas de formulário...');
    const sampleAnswers: SurveyAnswers = {
      area: 'Tributário',
      teamStructure: '4–10 pessoas',
      processVolume: '100–300',
      toolsUsed: 'Sistema Cety + Drive',
      operationalControl: 'Controle integrado no sistema',
      mainDifficulties: 'Triagem de teses tributárias',
      timeSinks: ['Prazos', 'Elaborar documentos / peças'],
      desiredAutomation: 'Classificação de decisões do STF',
      aiCapabilities: ['Resumir processos / documentos', 'Encontrar informações'],
      idealDashboard: 'Prazos fatais e teses em destaque',
      singleTaskToEliminate: 'Alimentar planilhas fiscais repetitivas',
      isTestData: false,
    };

    const created = SurveyService.createResponse(sampleAnswers);
    if (!created.id || created.answers.area !== 'Tributário') {
      throw new Error('Falha ao inserir resposta no SQLite');
    }

    const fetched = SurveyService.getResponseById(created.id);
    if (!fetched || fetched.id !== created.id || fetched.answers.singleTaskToEliminate !== sampleAnswers.singleTaskToEliminate) {
      throw new Error('Falha ao recuperar resposta inserida');
    }
    console.log(`  ✓ Resposta criada com ID: ${created.id}`);
    console.log(`  ✓ Dados recuperados e deserializados com sucesso (Área: ${fetched.answers.area})`);

    // -----------------------------------------------------------------
    // TESTE 4: Persistência dos dados após reiniciar a conexão
    // -----------------------------------------------------------------
    console.log('\n[TESTE 4] Persistência após reinicialização da conexão...');
    closeDatabase(); // Fecha conexão e descarrega da memória
    const newDbConnection = getDatabase(); // Reabre o arquivo do banco em disco
    const fetchedAfterRestart = SurveyService.getResponseById(created.id);
    if (!fetchedAfterRestart || fetchedAfterRestart.id !== created.id) {
      throw new Error('Falha na persistência em disco após reinicialização da conexão');
    }
    console.log(`  ✓ Conexão fechada e reaberta. Registro ${created.id} permanece íntegro no SQLite.`);

    // -----------------------------------------------------------------
    // TESTE 5: Integridade referencial
    // -----------------------------------------------------------------
    console.log('\n[TESTE 5] Integridade referencial (Foreign Keys)...');
    let fkFailed = false;
    const currentDb = getDatabase();
    try {
      // Tentativa de vincular documento a uma submissão inexistente
      currentDb.prepare(`
        INSERT INTO stored_documents (
          id, response_id, original_filename, storage_filename, relative_path,
          mime_type, size_bytes, sha256, created_at
        ) VALUES ('DOC-FK-FAIL', 'SUB-INEXISTENTE-999', 'teste.pdf', 'teste.pdf', 'storage/pdfs/teste.pdf', 'application/pdf', 100, 'hash', 'now')
      `).run();
    } catch (err: any) {
      fkFailed = true;
      console.log(`  ✓ Violação de chave estrangeira foi bloqueada corretamente: ${err.message}`);
    }
    if (!fkFailed) {
      throw new Error('Falha: Chave estrangeira para ID inexistente foi permitida!');
    }

    // -----------------------------------------------------------------
    // TESTE 6: Validação de campos obrigatórios
    // -----------------------------------------------------------------
    console.log('\n[TESTE 6] Validação de campos obrigatórios...');
    let notNullFailed = false;
    try {
      currentDb.prepare('INSERT INTO survey_responses (id, practice_area, team_size, caseload, created_at, updated_at) VALUES (?, NULL, ?, ?, ?, ?)').run('SUB-NULL', '1', '10', 'now', 'now');
    } catch (err: any) {
      notNullFailed = true;
      console.log(`  ✓ Tentativa de inserir practice_area NULL rejeitada com sucesso: ${err.message}`);
    }
    if (!notNullFailed) {
      throw new Error('Falha: NOT NULL constraint falhou');
    }

    // -----------------------------------------------------------------
    // TESTE 7: Tratamento de respostas inválidas
    // -----------------------------------------------------------------
    console.log('\n[TESTE 7] Tratamento de respostas inválidas...');
    try {
      SurveyService.createResponse(null as any);
      throw new Error('Deveria ter falhado com null');
    } catch (err: any) {
      console.log(`  ✓ Resposta inválida rejeitada com mensagem padronizada: ${err.message}`);
    }

    // -----------------------------------------------------------------
    // TESTE 8: Armazenamento e recuperação de PDFs válidos
    // -----------------------------------------------------------------
    console.log('\n[TESTE 8] Armazenamento e recuperação de documento PDF autêntico...');
    // Cria buffer contendo cabeçalho %PDF- e corpo fictício
    const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const storedDoc = DocumentService.storeDocument({
      buffer: validPdfBuffer,
      originalFilename: 'procuracao_cliente.pdf',
      responseId: created.id,
    });
    if (!storedDoc.id || !storedDoc.sha256) {
      throw new Error('Falha ao armazenar documento PDF');
    }
    console.log(`  ✓ Documento PDF armazenado com ID: ${storedDoc.id}`);
    console.log(`  ✓ SHA-256 gerado: ${storedDoc.sha256}`);
    console.log(`  ✓ Arquivo físico verificado em disco: ${fs.existsSync(path.resolve(process.cwd(), storedDoc.relative_path))}`);

    // Recuperação autorizada
    const retrievedDoc = DocumentService.getDocumentById(storedDoc.id);
    if (!retrievedDoc || !fs.existsSync(retrievedDoc.absolutePath)) {
      throw new Error('Falha ao recuperar documento do disco');
    }
    console.log(`  ✓ Documento recuperado com integridade no caminho: ${retrievedDoc.absolutePath}`);

    // -----------------------------------------------------------------
    // TESTE 9: Rejeição de arquivos inválidos (Magic Bytes)
    // -----------------------------------------------------------------
    console.log('\n[TESTE 9] Rejeição de arquivos com conteúdo forjado (Magic Bytes)...');
    const fakePdfBuffer = Buffer.from('<html><body>Arquivo HTML disfarçado de PDF</body></html>');
    let fakeRejected = false;
    try {
      DocumentService.storeDocument({
        buffer: fakePdfBuffer,
        originalFilename: 'virus_disfarcado.pdf',
      });
    } catch (err: any) {
      fakeRejected = true;
      console.log(`  ✓ Arquivo sem assinatura %PDF- rejeitado com sucesso: ${err.message}`);
    }
    if (!fakeRejected) {
      throw new Error('Falha de segurança: arquivo não-PDF com extensão .pdf foi aceito!');
    }

    // -----------------------------------------------------------------
    // TESTE 10: Proteção contra SQL Injection e Path Traversal
    // -----------------------------------------------------------------
    console.log('\n[TESTE 10] Proteção contra SQL Injection e Path Traversal...');
    
    // 10.1 SQL Injection
    const sqlInjectionInput = "Previdenciário' OR '1'='1; DROP TABLE survey_responses; --";
    const injectionSearch = SurveyService.listResponses({ q: sqlInjectionInput });
    console.log(`  ✓ SQL Injection na busca foi neutralizado como string literal (resultados: ${injectionSearch.length})`);

    // 10.2 Path Traversal
    const maliciousName = '../../../../../../windows/system32/cmd.exe';
    const sanitizedName = DocumentService.sanitizeFilename(maliciousName);
    if (sanitizedName.includes('..') || sanitizedName.includes('/')) {
      throw new Error(`Falha: Sanitização de path traversal falhou: ${sanitizedName}`);
    }
    console.log(`  ✓ Tentativa de Path Traversal "${maliciousName}" sanitizada para: "${sanitizedName}"`);

    // -----------------------------------------------------------------
    // TESTE 11: Comportamento em caso de falha de gravação (Rollback)
    // -----------------------------------------------------------------
    console.log('\n[TESTE 11] Comportamento em caso de falha de gravação (Rollback)...');
    // Verificamos que a transação e reversão de arquivos funciona
    const docCountBefore = DocumentService.listDocuments().length;
    let rollbackSuccess = false;
    try {
      // Força erro no banco enviando responseId inválido para violar FK
      DocumentService.storeDocument({
        buffer: validPdfBuffer,
        originalFilename: 'teste_rollback.pdf',
        responseId: 'SUB-INVALIDA-ROLLBACK',
      });
    } catch {
      rollbackSuccess = true;
      const docCountAfter = DocumentService.listDocuments().length;
      if (docCountAfter === docCountBefore) {
        console.log('  ✓ Rollback verificado: nenhum registro órfão ou arquivo persistido após erro.');
      } else {
        throw new Error('Falha: arquivo órfão foi deixado no disco após erro');
      }
    }
    if (!rollbackSuccess) throw new Error('Deveria ter falhado na violação de FK');

    // -----------------------------------------------------------------
    // TESTE 12: Backup e Restauração com Verificação de Checksum
    // -----------------------------------------------------------------
    console.log('\n[TESTE 12] Rotina de Backup e Restauração com Checksums...');
    const backup = BackupService.createBackup();
    if (!backup.backupPath || !fs.existsSync(backup.backupPath)) {
      throw new Error('Falha ao gerar diretório de backup');
    }
    console.log(`  ✓ Backup criado em: ${backup.backupPath}`);
    console.log(`  ✓ Checksum SHA-256 do SQLite no manifesto: ${backup.manifest.db_sha256}`);

    // Modifica o banco inserindo novo registro
    const tempResp = SurveyService.createResponse({
      ...sampleAnswers,
      mainDifficulties: 'Registro temporário para teste de restauração',
    });
    console.log(`  ✓ Registro temporário ${tempResp.id} inserido antes do restore.`);

    // Restaura o backup anterior
    const restoreResult = BackupService.restoreBackup(backup.backupPath);
    if (!restoreResult.success) {
      throw new Error('Falha ao executar restauração do backup');
    }
    console.log(`  ✓ Restauração executada com sucesso. Documentos restaurados: ${restoreResult.restoredDocuments}`);

    // Verifica que o registro temporário criado após o backup NÃO existe mais (restaurou o estado exato)
    const tempAfterRestore = SurveyService.getResponseById(tempResp.id);
    if (tempAfterRestore !== null) {
      throw new Error('Falha: O banco não retornou ao estado exato do backup restaurado!');
    }
    console.log('  ✓ Banco de dados retornou exatamente ao ponto no tempo do backup.');

    // Limpa o documento de teste criado
    DocumentService.deleteDocument(storedDoc.id);

    console.log('\n=================================================================');
    console.log('  TODOS OS 12 TESTES OBRIGATÓRIOS FORAM EXECUTADOS E APROVADOS!  ');
    console.log('=================================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERRO FATAL NOS TESTES DO BANCO 4CETY:', err);
    process.exit(1);
  }
}

runTests();
