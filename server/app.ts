import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  getReportBySubmissionId,
  runMigrations,
} from './db';
import {
  authenticateAdminCredentials,
  generateAdminToken,
  requireAdminAuth,
  changeAdminPassword,
} from './auth';
import { processAndSaveReport } from './reportService';
import { SurveyAnswers } from '../src/types/survey';
import { SurveyService } from './services/surveyService';
import { DocumentService } from './services/documentService';
import { BackupService } from './services/backupService';

dotenv.config();

// Executa migrações no arranque
runMigrations();

export const app = express();

// Configuração de CORS Seguro (Permite localhost, subdomínios da Vercel ou variável explícita)
const allowedOriginEnv = process.env.CORS_ALLOWED_ORIGIN || process.env.ALLOWED_ORIGINS;
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem origin (como scripts locais, curl, mobile apps, testes)
    if (!origin) return callback(null, true);

    if (allowedOriginEnv) {
      const allowedList = allowedOriginEnv.split(',').map((o) => o.trim());
      if (allowedList.includes(origin) || allowedList.includes('*')) {
        return callback(null, true);
      }
    }

    const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const isVercel = /^https:\/\/[a-zA-Z0-9_.-]+\.vercel\.app$/.test(origin);

    if (isLocal || isVercel) {
      return callback(null, true);
    }

    return callback(new Error(`Origem CORS não autorizada: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

// -------------------------------------------------------------
// RATE LIMITING RESILIENTE CONTRA FLOOD / DoS
// -------------------------------------------------------------
interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const ipRequests = new Map<string, { count: number; resetTime: number }>();

  // Limpeza periódica para prevenir vazamento de memória
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRequests.entries()) {
      if (now > entry.resetTime) {
        ipRequests.delete(ip);
      }
    }
  }, options.windowMs);
  if (interval.unref) interval.unref();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    let entry = ipRequests.get(ip);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + options.windowMs };
      ipRequests.set(ip, entry);
      return next();
    }

    entry.count += 1;
    if (entry.count > options.max) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.status(429).json({
        error: 'Muitas requisições',
        message: options.message,
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

export const submissionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Limite de submissões excedido para este IP. Aguarde 1 minuto para enviar novamente.',
});

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas de login. Por favor, tente novamente após alguns minutos.',
});

// Multer em memória para validação segura de Magic Bytes antes de salvar em disco
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: (parseInt(process.env.MAX_PDF_SIZE_MB || '10', 10)) * 1024 * 1024,
  },
});

// -------------------------------------------------------------
// 1. ÁREA PÚBLICA — SUBMISSÃO DO ADVOGADO
// -------------------------------------------------------------
app.post('/api/submissions', submissionLimiter, (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      res.status(400).json({
        error: 'Dados inválidos',
        message: 'Respostas do formulário não fornecidas corretamente.',
      });
      return;
    }

    // 1. Registra submissão no SQLite com consultas parametrizadas
    const submission = createSubmission(answers as SurveyAnswers);

    // 2. Dispara geração automática do relatório em segundo plano no backend
    try {
      processAndSaveReport(submission.id, answers as SurveyAnswers);
    } catch (genError) {
      console.warn(`Aviso: falha na geração inicial do relatório para ${submission.id}:`, genError);
      // As respostas são preservadas com status PENDENTE para que o admin possa gerar posteriormente
    }

    // 3. Resposta PÚBLICA e RESTRITA:
    // O advogado NUNCA recebe o relatório, nem respostas de terceiros, nem chaves internas!
    res.status(201).json({
      success: true,
      submissionId: submission.id,
      message: 'Suas respostas foram enviadas com sucesso e contribuirão para o desenvolvimento de uma ferramenta mais útil para a rotina jurídica.',
    });
  } catch (error) {
    console.error('Erro no processamento da submissão:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Não foi possível registrar as respostas. Tente novamente em instantes.',
    });
  }
});

// -------------------------------------------------------------
// 2. AUTENTICAÇÃO ADMINISTRATIVA
// -------------------------------------------------------------
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({
      error: 'Credenciais incompletas',
      message: 'Usuário e senha são obrigatórios.',
    });
    return;
  }

  const isValid = authenticateAdminCredentials(username, password);

  if (!isValid) {
    res.status(401).json({
      error: 'Credenciais inválidas',
      message: 'Usuário ou senha incorretos.',
    });
    return;
  }

  const token = generateAdminToken(username);

  // Define cookie HttpOnly para sessão protegida contra scripts maliciosos (XSS)
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('cety_admin_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({
    success: true,
    token,
    username,
    role: 'admin',
    expiresIn: '12h',
  });
});

// Encerramento de sessão administrativa (Logout)
app.post('/api/admin/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('cety_admin_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
  res.json({ success: true, message: 'Sessão administrativa encerrada com sucesso.' });
});

// Alteração segura de senha administrativa com validação e persistência no SQLite
app.post('/api/admin/change-password', requireAdminAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const username = (req as any).adminUser.username;

  if (!currentPassword || !newPassword) {
    res.status(400).json({
      error: 'Campos incompletos',
      message: 'Senha atual e nova senha são obrigatórias.',
    });
    return;
  }

  const result = changeAdminPassword(username, currentPassword, newPassword);
  if (!result.success) {
    res.status(400).json({ error: 'Erro ao alterar senha', message: result.message });
    return;
  }

  res.json({ success: true, message: result.message });
});

app.get('/api/admin/me', requireAdminAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: (req as any).adminUser,
  });
});

// -------------------------------------------------------------
// 3. ÁREA ADMINISTRATIVA PRIVADA — SUBMISSÕES (PROTEGIDA POR AUTH)
// -------------------------------------------------------------

// Listar todas as submissões com suporte a busca e filtros parametrizados
app.get('/api/admin/submissions', requireAdminAuth, (req, res) => {
  try {
    const { q, area, status } = req.query;
    const submissions = SurveyService.listResponses({
      q: typeof q === 'string' ? q : undefined,
      area: typeof area === 'string' ? area : undefined,
      status: typeof status === 'string' ? status : undefined,
    });

    res.json({
      total: submissions.length,
      submissions,
    });
  } catch (err) {
    console.error('Erro ao listar submissões:', err);
    res.status(500).json({ error: 'Erro ao consultar submissões' });
  }
});

// Consultar questionário individual completo
app.get('/api/admin/submissions/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const submission = getSubmissionById(id);

  if (!submission) {
    res.status(404).json({ error: 'Submissão não encontrada' });
    return;
  }

  res.json(submission);
});

// Consultar relatório estratégico armazenado da submissão
app.get('/api/admin/submissions/:id/report', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const report = getReportBySubmissionId(id);

  if (!report) {
    res.status(404).json({
      error: 'Relatório não encontrado',
      message: 'O relatório para esta submissão ainda não foi gerado ou falhou na geração inicial.',
    });
    return;
  }

  res.json(report);
});

// Gerar ou re-gerar relatório sob demanda pelo administrador
app.post('/api/admin/submissions/:id/generate-report', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const submission = getSubmissionById(id);

  if (!submission) {
    res.status(404).json({ error: 'Submissão não encontrada' });
    return;
  }

  try {
    const report = processAndSaveReport(id, submission.answers);
    res.json({
      success: true,
      message: 'Relatório gerado com sucesso.',
      report,
    });
  } catch (err) {
    res.status(500).json({
      error: 'Falha na geração do relatório',
      message: 'Não foi possível gerar o relatório. As respostas originais foram preservadas intactas.',
    });
  }
});

// Estatísticas consolidadas exclusivas do administrador
app.get('/api/admin/stats', requireAdminAuth, (_req, res) => {
  try {
    const stats = SurveyService.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Erro ao consultar estatísticas:', err);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// -------------------------------------------------------------
// 4. ÁREA ADMINISTRATIVA PRIVADA — DOCUMENTOS PDF (4CETY STORAGE)
// -------------------------------------------------------------

// Upload protegido de PDF com verificação de Magic Bytes (%PDF-)
app.post(
  '/api/admin/documents/upload',
  requireAdminAuth,
  (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            error: 'Arquivo excede o limite',
            message: `O arquivo enviado excede o tamanho máximo permitido de ${process.env.MAX_PDF_SIZE_MB || '10'}MB`,
          });
          return;
        }
        res.status(400).json({
          error: 'Falha no upload',
          message: err.message || 'Erro durante o upload do arquivo',
        });
        return;
      }
      next();
    });
  },
  (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado no campo "file"' });
      return;
    }

    const { responseId } = req.body;
    const stored = DocumentService.storeDocument({
      buffer: req.file.buffer,
      originalFilename: req.file.originalname,
      responseId: typeof responseId === 'string' ? responseId : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Documento PDF armazenado com sucesso no armazenamento local',
      document: stored,
    });
  } catch (err: any) {
    res.status(400).json({
      error: 'Falha no armazenamento do documento',
      message: err.message || 'Erro ao processar arquivo',
    });
  }
});

// Listar documentos armazenados localmente
app.get('/api/admin/documents', requireAdminAuth, (req, res) => {
  try {
    const { responseId } = req.query;
    const docs = DocumentService.listDocuments(typeof responseId === 'string' ? responseId : undefined);
    res.json({
      total: docs.length,
      documents: docs,
    });
  } catch (err) {
    console.error('Erro ao listar documentos:', err);
    res.status(500).json({ error: 'Erro ao consultar documentos armazenados' });
  }
});

// Download/Acesso seguro a um documento PDF armazenado
app.get('/api/admin/documents/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const docInfo = DocumentService.getDocumentById(id);

    if (!docInfo) {
      res.status(404).json({ error: 'Documento não encontrado' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(docInfo.metadata.original_filename)}"`
    );
    res.setHeader('Content-Length', docInfo.metadata.size_bytes);

    fs.createReadStream(docInfo.absolutePath).pipe(res);
  } catch (err: any) {
    res.status(400).json({
      error: 'Erro ao acessar documento',
      message: err.message,
    });
  }
});

// Exclusão segura de documento
app.delete('/api/admin/documents/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = DocumentService.deleteDocument(id);
    if (!deleted) {
      res.status(404).json({ error: 'Documento não encontrado para exclusão' });
      return;
    }
    res.json({ success: true, message: 'Documento excluído com sucesso' });
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao excluir documento', message: err.message });
  }
});

// -------------------------------------------------------------
// 5. ÁREA ADMINISTRATIVA PRIVADA — BACKUP & RECUPERAÇÃO
// -------------------------------------------------------------

// Criação de backup consistente manual pelo administrador
app.post('/api/admin/backup', requireAdminAuth, (_req, res) => {
  try {
    const backupResult = BackupService.createBackup();
    res.json({
      success: true,
      message: 'Backup local gerado com sucesso',
      backup: backupResult,
    });
  } catch (err: any) {
    console.error('Erro ao gerar backup:', err);
    res.status(500).json({ error: 'Falha na rotina de backup', message: err.message });
  }
});

// Lista de backups existentes
app.get('/api/admin/backups', requireAdminAuth, (_req, res) => {
  try {
    const backups = BackupService.listBackups();
    res.json({
      total: backups.length,
      backups,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar backups locais' });
  }
});

// -------------------------------------------------------------
// 6. SERVIÇO DE ARQUIVOS ESTÁTICOS DO FRONTEND (SPA FALLBACK)
// -------------------------------------------------------------
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}
