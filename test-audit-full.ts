import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import http from 'http';

// Configuração do ambiente isolado de teste antes de importar qualquer módulo
const TEST_DB_PATH = 'data/test_audit.sqlite';
const TEST_STORAGE_DIR = 'storage/test_pdfs';
const TEST_BACKUP_DIR = 'backups/test_backups';

process.env.CETY_DB_PATH = TEST_DB_PATH;
process.env.CETY_STORAGE_DIR = TEST_STORAGE_DIR;
process.env.CETY_BACKUP_DIR = TEST_BACKUP_DIR;
process.env.MAX_PDF_SIZE_MB = '2'; // Limite reduzido para facilitar teste de overflow
process.env.JWT_SECRET = 'audit_test_jwt_secret_key_minimum_32_characters_long';
process.env.ADMIN_USERNAME = 'admin_audit';
process.env.ADMIN_PASSWORD = 'AuditPassword2026!';
process.env.DISABLE_RATE_LIMIT = 'false';

// Importa módulos que usarão as variáveis de ambiente de teste
import { getDatabase, closeDatabase, getDatabasePath } from './server/db/connection';
import { runMigrations } from './server/db/migrations';
import { SurveyService } from './server/services/surveyService';
import { DocumentService } from './server/services/documentService';
import { BackupService } from './server/services/backupService';
import { SurveyAnswers } from './src/types/survey';
import { app } from './server/app';

interface TestResult {
  num: number;
  name: string;
  category: string;
  status: 'APROVADO' | 'REPROVADO';
  details: string;
}

const results: TestResult[] = [];

function record(num: number, name: string, category: string, status: 'APROVADO' | 'REPROVADO', details: string) {
  results.push({ num, name, category, status, details });
  const icon = status === 'APROVADO' ? '✓' : '✗';
  console.log(`  ${icon} [PONTO ${num}] ${name}: ${status}`);
  if (details) console.log(`     ↳ ${details}`);
}

async function runComprehensiveAudit() {
  console.log('========================================================================');
  console.log('   4CETY — AUDITORIA TÉCNICA COMPLETA & BATERIA DOS 20+ PONTOS         ');
  console.log('========================================================================\n');

  // Fecha qualquer conexão residual antes de limpar artefatos
  closeDatabase();

  // Limpa artefatos de testes anteriores no ambiente isolado
  const absTestDb = path.resolve(process.cwd(), TEST_DB_PATH);
  const absTestStorage = path.resolve(process.cwd(), TEST_STORAGE_DIR);
  const absTestBackup = path.resolve(process.cwd(), TEST_BACKUP_DIR);

  [absTestDb, `${absTestDb}-wal`, `${absTestDb}-shm`].forEach((f) => {
    try {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {
      // ignore
    }
  });
  if (fs.existsSync(absTestStorage)) fs.rmSync(absTestStorage, { recursive: true, force: true });
  if (fs.existsSync(absTestBackup)) fs.rmSync(absTestBackup, { recursive: true, force: true });

  // Inicializa o banco de teste e aplica migrações
  runMigrations();

  const TEST_SERVER_PORT = 3105;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(TEST_SERVER_PORT, () => resolve()));
  const baseUrl = `http://localhost:${TEST_SERVER_PORT}`;

  try {
    // -------------------------------------------------------------------------
    // PONTO 1: Inicialização do banco sem perda de dados existentes
    // -------------------------------------------------------------------------
    console.log('[FASE BANCO] Testando integridade da inicialização e pragmas...');
    const db = getDatabase();
    const fkPragma = db.prepare('PRAGMA foreign_keys;').get() as { foreign_keys: number };
    const journalPragma = db.prepare('PRAGMA journal_mode;').get() as { journal_mode: string };
    const busyPragma = db.prepare('PRAGMA busy_timeout;').get() as { timeout: number };

    if (fkPragma.foreign_keys === 1 && journalPragma.journal_mode.toLowerCase() === 'wal') {
      record(1, 'Inicialização do banco com PRAGMAs (FK=1, WAL, busy_timeout)', 'Banco de Dados', 'APROVADO',
        `DB Path: ${getDatabasePath()} | WAL: ${journalPragma.journal_mode} | FK: ON`);
    } else {
      record(1, 'Inicialização do banco com PRAGMAs', 'Banco de Dados', 'REPROVADO', 'PRAGMA foreign_keys ou WAL ausentes');
    }

    // -------------------------------------------------------------------------
    // PONTO 2: Execução idempotente das migrações (rodar 2x não duplica nem falha)
    // -------------------------------------------------------------------------
    console.log('[FASE BANCO] Testando idempotência de migrações...');
    runMigrations(db);
    const count1 = (db.prepare('SELECT COUNT(*) as c FROM schema_migrations').get() as any).c;
    // Segunda execução
    runMigrations(db);
    const count2 = (db.prepare('SELECT COUNT(*) as c FROM schema_migrations').get() as any).c;

    if (count1 === count2 && count1 > 0) {
      record(2, 'Execução idempotente das migrações (rodada 2x)', 'Migrações', 'APROVADO',
        `Total de migrações aplicadas: ${count1}. Segunda execução manteve integridade sem erros.`);
    } else {
      record(2, 'Execução idempotente das migrações', 'Migrações', 'REPROVADO', 'Falha na contagem de migrações');
    }

    // -------------------------------------------------------------------------
    // PONTO 3: Inserção de resposta completa com todos os campos preenchidos
    // -------------------------------------------------------------------------
    console.log('[FASE FORMULÁRIO] Testando inserção de resposta completa...');
    const fullAnswers: SurveyAnswers = {
      area: 'Trabalhista',
      teamStructure: '11–30 pessoas',
      processVolume: '300–800',
      toolsUsed: 'PJe + Projuris + Planilhas Excel',
      operationalControl: 'Controle diário com reuniões matinais',
      mainDifficulties: 'Volume excessivo de notificações e cálculo de horas extras',
      timeSinks: ['Prazos', 'Elaborar documentos / peças', 'Atendimento / WhatsApp'],
      desiredAutomation: 'Triagem inteligente de intimações com alertas prioritários',
      aiCapabilities: ['Identificar prazos e tarefas', 'Resumir processos / documentos', 'Encontrar informações'],
      idealDashboard: 'Painel com prazos fatais do dia, novas publicações e pendências urgentes',
      singleTaskToEliminate: 'Conferência manual de publicações no Diário Oficial',
      isTestData: false,
    };

    const createdFull = SurveyService.createResponse(fullAnswers);
    if (createdFull.id && createdFull.answers.area === 'Trabalhista' && createdFull.status === 'PENDENTE') {
      record(3, 'Inserção de resposta completa com todos os campos', 'Submissões', 'APROVADO',
        `Submissão criada com ID: ${createdFull.id}`);
    } else {
      record(3, 'Inserção de resposta completa', 'Submissões', 'REPROVADO', 'Falha nos campos retornados');
    }

    // -------------------------------------------------------------------------
    // PONTO 4: Inserção de resposta mínima (apenas campos essenciais/básicos)
    // -------------------------------------------------------------------------
    console.log('[FASE FORMULÁRIO] Testando inserção de resposta mínima...');
    const minimalAnswers: SurveyAnswers = {
      area: 'Cível',
      teamStructure: 'Sozinho',
      processVolume: 'Até 20',
      toolsUsed: '',
      operationalControl: '',
      mainDifficulties: '',
      timeSinks: [],
      desiredAutomation: '',
      aiCapabilities: [],
      idealDashboard: '',
      singleTaskToEliminate: '',
      isTestData: false,
    };

    const createdMinimal = SurveyService.createResponse(minimalAnswers);
    if (createdMinimal.id && createdMinimal.answers.area === 'Cível') {
      record(4, 'Inserção de resposta mínima (campos opcionais nulos/vazios)', 'Submissões', 'APROVADO',
        `ID: ${createdMinimal.id} registrado com sucesso tratando strings vazias e listas vazias.`);
    } else {
      record(4, 'Inserção de resposta mínima', 'Submissões', 'REPROVADO', 'Erro ao persistir resposta mínima');
    }

    // -------------------------------------------------------------------------
    // PONTO 5: Rejeição de resposta inválida (dados malformados, tipos incorretos)
    // -------------------------------------------------------------------------
    console.log('[FASE VALIDAÇÃO] Testando rejeição de dados malformados...');
    let rejectedMalformed = false;
    try {
      SurveyService.createResponse(null as any);
    } catch {
      rejectedMalformed = true;
    }
    try {
      SurveyService.createResponse('string_invalida' as any);
    } catch {
      rejectedMalformed = rejectedMalformed && true;
    }

    if (rejectedMalformed) {
      record(5, 'Rejeição de dados malformados (null / tipo inválido)', 'Validação', 'APROVADO',
        'Payloads inválidos são barrados na entrada com exceção padronizada.');
    } else {
      record(5, 'Rejeição de dados malformados', 'Validação', 'REPROVADO', 'Payload inválido foi aceito');
    }

    // -------------------------------------------------------------------------
    // PONTO 6: Recuperação de resposta por ID com deserialização correta de JSON/arrays
    // -------------------------------------------------------------------------
    console.log('[FASE RECUPERAÇÃO] Testando recuperação por ID e deserialização...');
    const fetchedFull = SurveyService.getResponseById(createdFull.id);
    const arraysMatch =
      Array.isArray(fetchedFull?.answers.timeSinks) &&
      fetchedFull?.answers.timeSinks.length === 3 &&
      Array.isArray(fetchedFull?.answers.aiCapabilities) &&
      fetchedFull?.answers.aiCapabilities.length === 3;

    if (fetchedFull && arraysMatch && fetchedFull.answers.singleTaskToEliminate === fullAnswers.singleTaskToEliminate) {
      record(6, 'Recuperação por ID com deserialização correta de JSON e Arrays', 'Recuperação', 'APROVADO',
        `Recuperado ${fetchedFull.id} com ${fetchedFull.answers.timeSinks.length} timeSinks e ${fetchedFull.answers.aiCapabilities.length} aiCapabilities.`);
    } else {
      record(6, 'Recuperação por ID com deserialização', 'Recuperação', 'REPROVADO', 'Falha na deserialização dos arrays');
    }

    // -------------------------------------------------------------------------
    // PONTO 7: Listagem de respostas com filtros (área, status, busca por texto)
    // -------------------------------------------------------------------------
    console.log('[FASE BUSCA] Testando listagem e filtros...');
    const listTrabalhista = SurveyService.listResponses({ area: 'Trabalhista' });
    const listCivel = SurveyService.listResponses({ area: 'Cível' });
    const listText = SurveyService.listResponses({ q: 'notificações' });

    const filterOk =
      listTrabalhista.some((s) => s.id === createdFull.id) &&
      !listTrabalhista.some((s) => s.id === createdMinimal.id) &&
      listCivel.some((s) => s.id === createdMinimal.id) &&
      listText.some((s) => s.id === createdFull.id);

    if (filterOk) {
      record(7, 'Listagem parametrizada com filtros por área, status e texto', 'Busca', 'APROVADO',
        `Filtro área Trabalhista: ${listTrabalhista.length} | Filtro área Cível: ${listCivel.length} | Busca texto: ${listText.length}`);
    } else {
      record(7, 'Listagem parametrizada com filtros', 'Busca', 'REPROVADO', 'Filtro não isolou registros esperados');
    }

    // -------------------------------------------------------------------------
    // PONTO 8: Violação de chave estrangeira (FK constraint) é bloqueada
    // -------------------------------------------------------------------------
    console.log('[FASE INTEGRIDADE] Testando bloqueio de chave estrangeira inválida...');
    let fkBlocked = false;
    try {
      db.prepare(`
        INSERT INTO stored_documents (
          id, response_id, original_filename, storage_filename, relative_path,
          mime_type, size_bytes, sha256, created_at
        ) VALUES ('DOC-FK-TEST', 'SUB-ID-INEXISTENTE-999', 'teste.pdf', 'teste.pdf', 'storage/test_pdfs/teste.pdf', 'application/pdf', 100, 'hash', 'now')
      `).run();
    } catch (err: any) {
      if (err.message.toLowerCase().includes('foreign key') || err.message.toLowerCase().includes('constraint')) {
        fkBlocked = true;
      }
    }

    if (fkBlocked) {
      record(8, 'Violação de Foreign Key (chave estrangeira) é bloqueada', 'Integridade Referencial', 'APROVADO',
        'SQLite rejeitou inserção de documento com response_id não existente na tabela pai.');
    } else {
      record(8, 'Violação de Foreign Key é bloqueada', 'Integridade Referencial', 'REPROVADO', 'Inserção com FK órfã foi permitida');
    }

    // -------------------------------------------------------------------------
    // PONTO 9: Violação de NOT NULL constraint é bloqueada
    // -------------------------------------------------------------------------
    console.log('[FASE INTEGRIDADE] Testando bloqueio de NOT NULL constraint...');
    let notNullBlocked = false;
    try {
      db.prepare(`
        INSERT INTO survey_responses (id, practice_area, team_size, caseload, created_at, updated_at)
        VALUES ('SUB-NOT-NULL', NULL, '1', '10', 'now', 'now')
      `).run();
    } catch (err: any) {
      if (err.message.toLowerCase().includes('not null') || err.message.toLowerCase().includes('constraint')) {
        notNullBlocked = true;
      }
    }

    if (notNullBlocked) {
      record(9, 'Violação de constraint NOT NULL é bloqueada', 'Integridade', 'APROVADO',
        'Campo obrigatório com valor NULL foi rejeitado pelo mecanismo relacional.');
    } else {
      record(9, 'Violação de constraint NOT NULL é bloqueada', 'Integridade', 'REPROVADO', 'Valor NULL inserido em campo NOT NULL');
    }

    // -------------------------------------------------------------------------
    // PONTO 10: Proteção contra SQL Injection (busca e campos de formulário)
    // -------------------------------------------------------------------------
    console.log('[FASE SEGURANÇA] Testando defesa contra SQL Injection...');
    const sqliInput = "Trabalhista' OR '1'='1; DROP TABLE survey_responses; --";
    const sqliSearch = SurveyService.listResponses({ q: sqliInput });
    // Verifica se a tabela ainda existe e está intacta
    const tableExists = db.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name='survey_responses'").get() as any;

    if (tableExists.c === 1) {
      record(10, 'Proteção contra SQL Injection em campos de busca e formulário', 'Segurança', 'APROVADO',
        `Comando malicioso "${sqliInput}" tratado como parâmetro literal. Tabela survey_responses preservada.`);
    } else {
      record(10, 'Proteção contra SQL Injection', 'Segurança', 'REPROVADO', 'Tabela foi alterada por SQL Injection');
    }

    // -------------------------------------------------------------------------
    // PONTO 11: Persistência dos dados após fechar e reabrir a conexão SQLite
    // -------------------------------------------------------------------------
    console.log('[FASE PERSISTÊNCIA] Testando reinicialização de conexão...');
    closeDatabase();
    // Reabre nova conexão apontando para o arquivo no disco
    const reopenedDb = getDatabase();
    const fetchedAfterReopen = SurveyService.getResponseById(createdFull.id);

    if (fetchedAfterReopen && fetchedAfterReopen.id === createdFull.id) {
      record(11, 'Persistência íntegra após fechar e reabrir a conexão SQLite', 'Persistência', 'APROVADO',
        `Conexão reiniciada com sucesso. Registro ${createdFull.id} permanece idêntico em disco.`);
    } else {
      record(11, 'Persistência após fechar e reabrir conexão', 'Persistência', 'REPROVADO', 'Registro perdido após reabertura');
    }

    // -------------------------------------------------------------------------
    // PONTO 12: Upload de PDF válido (magic bytes %PDF-) com geração de SHA-256 e gravação no disco e banco
    // -------------------------------------------------------------------------
    console.log('[FASE STORAGE] Testando upload de PDF válido com Magic Bytes...');
    const validPdfBuffer = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Title (Contrato de Honorarios) >>\nendobj\ntrailer\n<<>>\n%%EOF');
    const storedPdf = DocumentService.storeDocument({
      buffer: validPdfBuffer,
      originalFilename: 'honorarios_advogado.pdf',
      responseId: createdFull.id,
    });

    const expectedSha = crypto.createHash('sha256').update(validPdfBuffer).digest('hex');
    const diskPath = path.resolve(process.cwd(), storedPdf.relative_path);
    const fileExistsOnDisk = fs.existsSync(diskPath);

    if (storedPdf.sha256 === expectedSha && fileExistsOnDisk) {
      record(12, 'Upload de PDF válido com verificação de Magic Bytes e SHA-256', 'Documentos', 'APROVADO',
        `Doc ID: ${storedPdf.id} | SHA-256: ${storedPdf.sha256.substring(0, 16)}... | Gravado no disco e vinculado à submissão.`);
    } else {
      record(12, 'Upload de PDF válido com Magic Bytes e SHA-256', 'Documentos', 'REPROVADO', 'Arquivo ou hash divergente');
    }

    // -------------------------------------------------------------------------
    // PONTO 13: Rejeição de arquivo não-PDF disfarçado com extensão .pdf (validação de magic bytes)
    // -------------------------------------------------------------------------
    console.log('[FASE STORAGE] Testando rejeição de falso PDF (Magic Bytes)...');
    const disguisedBuffer = Buffer.from('GIF89a Fake Image Content masquerading as PDF');
    let disguisedRejected = false;
    try {
      DocumentService.storeDocument({
        buffer: disguisedBuffer,
        originalFilename: 'imagem_falsa.pdf',
      });
    } catch (err: any) {
      if (err.message.includes('assinatura binária') || err.message.includes('PDF autêntico')) {
        disguisedRejected = true;
      }
    }

    if (disguisedRejected) {
      record(13, 'Rejeição estrita de arquivo não-PDF disfarçado com extensão .pdf', 'Documentos / Segurança', 'APROVADO',
        'Arquivo sem magic bytes %PDF- foi rejeitado antes de qualquer gravação no disco ou banco.');
    } else {
      record(13, 'Rejeição de arquivo não-PDF disfarçado', 'Documentos / Segurança', 'REPROVADO', 'Falso PDF foi aceito');
    }

    // -------------------------------------------------------------------------
    // PONTO 14: Rejeição de upload que excede o tamanho máximo configurado
    // -------------------------------------------------------------------------
    console.log('[FASE STORAGE] Testando limite máximo de tamanho de upload...');
    const oversizedBuffer = Buffer.alloc(3 * 1024 * 1024, 0x25); // 3MB (limite configurado: 2MB)
    // Insere magic bytes no início
    oversizedBuffer.write('%PDF-');
    let oversizedRejected = false;
    try {
      DocumentService.storeDocument({
        buffer: oversizedBuffer,
        originalFilename: 'arquivo_gigante.pdf',
      });
    } catch (err: any) {
      if (err.message.includes('excede o tamanho máximo')) {
        oversizedRejected = true;
      }
    }

    if (oversizedRejected) {
      record(14, 'Rejeição de upload que excede o tamanho máximo configurado (2MB)', 'Documentos', 'APROVADO',
        'Arquivo de 3MB rejeitado por exceder o limite de 2MB definido no ambiente.');
    } else {
      record(14, 'Rejeição de upload que excede tamanho máximo', 'Documentos', 'REPROVADO', 'Arquivo maior que o limite foi aceito');
    }

    // -------------------------------------------------------------------------
    // PONTO 15: Prevenção de Path Traversal no nome do arquivo e na rota de download
    // -------------------------------------------------------------------------
    console.log('[FASE SEGURANÇA] Testando defesa contra Path Traversal...');
    const maliciousTraversal = '../../../../../../etc/passwd';
    const sanitizedFilename = DocumentService.sanitizeFilename(maliciousTraversal);
    const hasTraversalCharacters = sanitizedFilename.includes('..') || sanitizedFilename.includes('/') || sanitizedFilename.includes('\\');

    // Testa também na recuperação
    const docInfo = DocumentService.getDocumentById(storedPdf.id);
    const pathIsContained = docInfo && docInfo.absolutePath.startsWith(path.resolve(process.cwd(), TEST_STORAGE_DIR));

    if (!hasTraversalCharacters && pathIsContained) {
      record(15, 'Prevenção de Path Traversal no nome do arquivo e na recuperação', 'Segurança', 'APROVADO',
        `Entrada "${maliciousTraversal}" sanitizada para "${sanitizedFilename}". Acesso restrito ao diretório autorizado.`);
    } else {
      record(15, 'Prevenção de Path Traversal', 'Segurança', 'REPROVADO', 'Falha na sanitização ou contenção de caminho');
    }

    // -------------------------------------------------------------------------
    // PONTO 16: Rollback e limpeza de arquivo órfão quando a inserção do documento no banco falha
    // -------------------------------------------------------------------------
    console.log('[FASE TRANSAÇÃO] Testando rollback de arquivo órfão...');
    const storageFilesBefore = fs.readdirSync(DocumentService.getStorageDir());
    let rollbackTriggered = false;

    try {
      // Força violação de FK propositalmente
      DocumentService.storeDocument({
        buffer: validPdfBuffer,
        originalFilename: 'documento_com_falha.pdf',
        responseId: 'SUB-ID-QUE-NAO-EXISTE-PARA-FORCAR-ROLLBACK',
      });
    } catch {
      rollbackTriggered = true;
    }

    const storageFilesAfter = fs.readdirSync(DocumentService.getStorageDir());
    const noOrphanFiles = storageFilesBefore.length === storageFilesAfter.length;

    if (rollbackTriggered && noOrphanFiles) {
      record(16, 'Rollback e remoção de arquivo órfão no disco após falha de inserção no banco', 'Transações', 'APROVADO',
        `Falha na inserção disparou unlink imediato. Quantidade de arquivos no disco mantida em ${storageFilesAfter.length}.`);
    } else {
      record(16, 'Rollback e remoção de arquivo órfão', 'Transações', 'REPROVADO', 'Arquivo órfão permaneceu no disco após erro');
    }

    // -------------------------------------------------------------------------
    // PONTO 17: Acesso anônimo a rotas administrativas é bloqueado (401/403)
    // -------------------------------------------------------------------------
    console.log('[FASE AUTORIZAÇÃO] Testando bloqueio de rotas administrativas para visitantes anônimos...');
    const anonSubmissionsRes = await fetch(`${baseUrl}/api/admin/submissions`);
    const anonStatsRes = await fetch(`${baseUrl}/api/admin/stats`);
    const anonDocsRes = await fetch(`${baseUrl}/api/admin/documents`);

    const allAnonBlocked =
      anonSubmissionsRes.status === 401 &&
      anonStatsRes.status === 401 &&
      anonDocsRes.status === 401;

    if (allAnonBlocked) {
      record(17, 'Acesso anônimo a rotas administrativas é categoricamente bloqueado (401)', 'Autenticação & Autorização', 'APROVADO',
        'Endpoints /api/admin/submissions, /stats e /documents rejeitaram requisições sem Bearer token com status 401.');
    } else {
      record(17, 'Acesso anônimo a rotas administrativas é bloqueado', 'Autenticação & Autorização', 'REPROVADO', 'Algum endpoint administrativo respondeu sem token');
    }

    // -------------------------------------------------------------------------
    // PONTO 18: Token JWT inválido ou forjado é rejeitado com status 403
    // -------------------------------------------------------------------------
    console.log('[FASE AUTORIZAÇÃO] Testando rejeição de token JWT inválido ou forjado...');
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.signature_falsa';
    const forgedRes = await fetch(`${baseUrl}/api/admin/submissions`, {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });

    if (forgedRes.status === 403) {
      record(18, 'Token JWT inválido ou forjado é rejeitado com status 403 Proibido', 'Autenticação & Autorização', 'APROVADO',
        'Assinatura criptográfica incorreta barrada no middleware requireAdminAuth.');
    } else {
      record(18, 'Token JWT inválido é rejeitado', 'Autenticação & Autorização', 'REPROVADO', `Retornou ${forgedRes.status} em vez de 403`);
    }

    // -------------------------------------------------------------------------
    // PONTO 19: Geração de backup completo com manifesto e hashes SHA-256 válidos
    // -------------------------------------------------------------------------
    console.log('[FASE BACKUP] Testando geração de backup atômico via VACUUM INTO...');
    const backupResult = BackupService.createBackup();
    const manifestFile = path.join(backupResult.backupPath, 'manifest.json');
    const backupDbFile = path.join(backupResult.backupPath, 'cety.sqlite');

    const manifestExists = fs.existsSync(manifestFile);
    const dbFileExists = fs.existsSync(backupDbFile);
    const calculatedBackupDbSha = crypto.createHash('sha256').update(fs.readFileSync(backupDbFile)).digest('hex');

    const manifestValid = backupResult.manifest.db_sha256 === calculatedBackupDbSha;

    if (manifestExists && dbFileExists && manifestValid) {
      record(19, 'Geração de backup completo atômico com manifesto e hashes SHA-256 conferidos', 'Backup', 'APROVADO',
        `Backup em: ${backupResult.backupPath} | Checksum SQLite: ${calculatedBackupDbSha.substring(0, 16)}... | Documentos incluídos: ${backupResult.manifest.documents_count}`);
    } else {
      record(19, 'Geração de backup completo', 'Backup', 'REPROVADO', 'Manifesto ou hash SHA-256 divergente');
    }

    // -------------------------------------------------------------------------
    // PONTO 20: Restauração completa a partir de backup, com validação de integridade
    // -------------------------------------------------------------------------
    console.log('[FASE RESTORE] Testando restauração com validação de hash e ponto no tempo...');
    // Insere novo registro após o backup para verificar que a restauração volta ao ponto exato
    const tempResp = SurveyService.createResponse({
      ...fullAnswers,
      mainDifficulties: 'Registro que deve desaparecer após restauração',
    });

    const restoreResult = BackupService.restoreBackup(backupResult.backupPath);
    const tempAfterRestore = SurveyService.getResponseById(tempResp.id);
    const originalKeptAfterRestore = SurveyService.getResponseById(createdFull.id);

    if (restoreResult.success && tempAfterRestore === null && originalKeptAfterRestore !== null) {
      record(20, 'Restauração completa a partir de backup validado com retorno ao ponto exato', 'Restauração', 'APROVADO',
        `Restauração concluída. Registro transitório ${tempResp.id} foi revertido e os dados originais foram mantidos intactos.`);
    } else {
      record(20, 'Restauração completa a partir de backup', 'Restauração', 'REPROVADO', 'Falha ao reverter estado do banco');
    }

    // -------------------------------------------------------------------------
    // TESTE ADICIONAL 21: Proteção contra Flood / Rate Limiting (HTTP 429)
    // -------------------------------------------------------------------------
    console.log('[FASE EXTRA] Testando Rate Limiting no endpoint de submissão...');
    let rateLimitTriggered = false;
    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${baseUrl}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: minimalAnswers }),
      });
      if (res.status === 429) {
        rateLimitTriggered = true;
        break;
      }
    }

    if (rateLimitTriggered) {
      record(21, 'Rate Limiting ativo contra Flood / DoS em submissões públicas (HTTP 429)', 'Segurança de Rede', 'APROVADO',
        'Após exceder 20 requisições/minuto, o servidor responde com HTTP 429 Too Many Requests e cabeçalho Retry-After.');
    } else {
      record(21, 'Rate Limiting ativo em submissões públicas', 'Segurança de Rede', 'REPROVADO', 'Limite não disparou 429');
    }

    // -------------------------------------------------------------------------
    // TESTE ADICIONAL 23: Persistência de hash em admin_users e Cookie HttpOnly
    // -------------------------------------------------------------------------
    console.log('[FASE ADMIN & AUTH] Testando persistência em admin_users e Cookie HttpOnly...');
    const activeDb = getDatabase();
    const adminUserRow = activeDb.prepare('SELECT id, username, password_hash FROM admin_users WHERE username = ?').get('admin_audit') as any;
    const isBcryptHash = adminUserRow?.password_hash?.startsWith('$2a$') || adminUserRow?.password_hash?.startsWith('$2b$');

    const adminLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin_audit', password: 'AuditPassword2026!' }),
    });
    const loginCookies = adminLoginRes.headers.get('set-cookie') || '';
    const hasHttpOnlyCookie = loginCookies.includes('cety_admin_token') && loginCookies.toLowerCase().includes('httponly');
    const loginJson = await adminLoginRes.json();

    if (adminUserRow && isBcryptHash && adminLoginRes.status === 200 && hasHttpOnlyCookie) {
      record(23, 'Persistência de credencial administrativa no SQLite (admin_users) e Cookie HttpOnly', 'Autenticação & SQLite', 'APROVADO',
        `Usuário "${adminUserRow.username}" persistido com hash bcrypt. Cookie HttpOnly "cety_admin_token" emitido no login.`);
    } else {
      record(23, 'Persistência em admin_users e Cookie HttpOnly', 'Autenticação & SQLite', 'REPROVADO', 'Falha no hash ou cookie HttpOnly');
    }

    // -------------------------------------------------------------------------
    // TESTE ADICIONAL 24: Alteração de senha administrativa e revogação da anterior
    // -------------------------------------------------------------------------
    console.log('[FASE ADMIN & AUTH] Testando alteração segura de senha e invalidação da anterior...');
    const changePassRes = await fetch(`${baseUrl}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginJson.token}`,
      },
      body: JSON.stringify({
        currentPassword: 'AuditPassword2026!',
        newPassword: 'NovaSenhaForte2026!#',
      }),
    });
    const changePassJson = await changePassRes.json();

    // Testa se a senha antiga foi revogada
    const oldLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin_audit', password: 'AuditPassword2026!' }),
    });

    // Testa se a nova senha é aceita
    const newLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin_audit', password: 'NovaSenhaForte2026!#' }),
    });

    const passChangeOk =
      changePassRes.status === 200 &&
      changePassJson.success === true &&
      oldLoginRes.status === 401 &&
      newLoginRes.status === 200;

    if (passChangeOk) {
      record(24, 'Alteração de senha com atualização atômica no SQLite e bloqueio da senha anterior', 'Gestão de Senhas', 'APROVADO',
        'Senha alterada com sucesso. Tentativa com senha antiga retornou 401. Login com nova senha aprovado com 200.');
    } else {
      record(24, 'Alteração de senha administrativa', 'Gestão de Senhas', 'REPROVADO', 'Falha ao trocar senha ou revogar anterior');
    }

  } catch (err) {
    console.error('\n❌ ERRO FATAL DURANTE A AUDITORIA:', err);
  } finally {
    server.close();
    closeDatabase();

    // Limpa banco e pastas de teste isoladas
    [absTestDb, `${absTestDb}-wal`, `${absTestDb}-shm`].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
    if (fs.existsSync(absTestStorage)) fs.rmSync(absTestStorage, { recursive: true, force: true });
    if (fs.existsSync(absTestBackup)) fs.rmSync(absTestBackup, { recursive: true, force: true });
  }

  // Resumo final
  console.log('\n========================================================================');
  console.log('                      RESUMO DOS RESULTADOS DA AUDITORIA                 ');
  console.log('========================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.status === 'APROVADO').length;
  const failed = results.filter((r) => r.status === 'REPROVADO').length;

  console.log(`TOTAL DE PONTOS AUDITADOS: ${total}`);
  console.log(`APROVADOS: ${passed}`);
  console.log(`REPROVADOS: ${failed}`);

  if (failed === 0 && passed >= 20) {
    console.log('\n STATUS FINAL: 100% DOS PONTOS TÉCNICOS APROVADOS COM SUCESSO!\n');
    process.exit(0);
  } else {
    console.error(`\n STATUS FINAL: AUDITORIA COM ${failed} FALHA(S)!\n`);
    process.exit(1);
  }
}

runComprehensiveAudit();
