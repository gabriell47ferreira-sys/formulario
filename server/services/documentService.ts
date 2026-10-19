import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getDatabase } from '../db/connection';
import { StoredDocumentRow } from '../db/types';

dotenv.config();

export class DocumentService {
  /**
   * Obtém o diretório absoluto de armazenamento de PDFs
   */
  static getStorageDir(): string {
    const envDir = process.env.CETY_STORAGE_DIR || 'storage/pdfs';
    const absoluteDir = path.resolve(process.cwd(), envDir);
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }
    return absoluteDir;
  }

  /**
   * Valida se um buffer corresponde a um PDF real verificando seus Magic Bytes (%PDF-)
   */
  static isRealPDF(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 5) {
      return false;
    }
    // Assinatura mágica de PDF: 0x25, 0x50, 0x44, 0x46, 0x2D (%PDF-)
    return (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46 &&
      buffer[4] === 0x2d
    );
  }

  /**
   * Sanitiza nomes de arquivos para mitigar riscos de Path Traversal
   */
  static sanitizeFilename(filename: string): string {
    if (!filename) return 'documento.pdf';
    // Remove qualquer componente de caminho ou traversal
    let base = path.basename(filename).replace(/[\0\r\n\t]/g, '');
    // Remove sequências de pontos que possam indicar traversal
    base = base.replace(/\.\.+/g, '.');
    // Permite caracteres alfanuméricos, hífens, sublinhados, pontos e espaços normais
    const sanitized = base.replace(/[^a-zA-Z0-9_\-. ]/g, '_').trim();
    if (!sanitized || sanitized === '.' || sanitized === '..') {
      return 'documento.pdf';
    }
    return sanitized.toLowerCase().endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
  }

  /**
   * Armazena um documento PDF com verificação de integridade e metadados no SQLite
   */
  static storeDocument(params: {
    buffer: Buffer;
    originalFilename: string;
    responseId?: string;
  }): StoredDocumentRow {
    const { buffer, originalFilename, responseId } = params;
    const maxSizeBytes = (parseInt(process.env.MAX_PDF_SIZE_MB || '10', 10)) * 1024 * 1024;

    // 1. Validação de tamanho
    if (!buffer || buffer.length === 0) {
      throw new Error('Arquivo vazio ou não fornecido');
    }
    if (buffer.length > maxSizeBytes) {
      throw new Error(`Arquivo excede o tamanho máximo permitido de ${process.env.MAX_PDF_SIZE_MB || '10'}MB`);
    }

    // 2. Validação estrita de extensão (.pdf)
    if (!originalFilename || !originalFilename.toLowerCase().endsWith('.pdf')) {
      throw new Error('Extensão inválida: o arquivo deve possuir a extensão .pdf');
    }

    // 3. Validação estrita de Magic Bytes (%PDF-)
    if (!this.isRealPDF(buffer)) {
      throw new Error('Conteúdo inválido: o arquivo não possui a assinatura binária de um documento PDF autêntico');
    }

    // 3. Sanitização de nome original
    const safeOriginalName = this.sanitizeFilename(originalFilename);

    // 4. Geração de identificadores únicos
    const docId = `DOC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const storageFilename = `${docId}_${crypto.randomBytes(4).toString('hex')}.pdf`;
    const storageDir = this.getStorageDir();
    const targetFilePath = path.join(storageDir, storageFilename);

    // 5. Cálculo do hash SHA-256 para integridade
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const envStorageDir = process.env.CETY_STORAGE_DIR || 'storage/pdfs';
    const relativePath = path.join(envStorageDir, storageFilename).replace(/\\/g, '/');
    const now = new Date().toISOString();

    // 6. Gravação atômica no disco com reversão (rollback) em caso de falha no banco
    try {
      fs.writeFileSync(targetFilePath, buffer);
    } catch (fsErr) {
      console.error('[DocumentService] Falha ao gravar arquivo em disco:', fsErr);
      throw new Error('Falha ao gravar arquivo no armazenamento local');
    }

    // 7. Registro dos metadados no SQLite
    const db = getDatabase();
    try {
      const stmt = db.prepare(`
        INSERT INTO stored_documents (
          id, response_id, original_filename, storage_filename, relative_path,
          mime_type, size_bytes, sha256, created_at
        ) VALUES (?, ?, ?, ?, ?, 'application/pdf', ?, ?, ?)
      `);

      stmt.run(
        docId,
        responseId || null,
        safeOriginalName,
        storageFilename,
        relativePath,
        buffer.length,
        sha256,
        now
      );

      return {
        id: docId,
        response_id: responseId || null,
        original_filename: safeOriginalName,
        storage_filename: storageFilename,
        relative_path: relativePath,
        mime_type: 'application/pdf',
        size_bytes: buffer.length,
        sha256,
        created_at: now,
      };
    } catch (dbErr) {
      // Rollback: se a gravação no banco falhou, removemos o arquivo em disco para não deixar órfãos
      console.error('[DocumentService] Erro ao registrar no SQLite. Executando rollback do arquivo em disco:', dbErr);
      try {
        if (fs.existsSync(targetFilePath)) {
          fs.unlinkSync(targetFilePath);
        }
      } catch (unlinkErr) {
        console.error('[DocumentService] Erro ao remover arquivo no rollback:', unlinkErr);
      }
      throw new Error('Falha ao persistir metadados do documento no banco de dados');
    }
  }

  /**
   * Obtém documento por ID e verifica proteção contra Path Traversal
   */
  static getDocumentById(id: string): {
    metadata: StoredDocumentRow;
    absolutePath: string;
  } | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM stored_documents WHERE id = ?');
    const row = stmt.get(id) as StoredDocumentRow | undefined;

    if (!row) {
      return null;
    }

    const storageDir = this.getStorageDir();
    const resolvedPath = path.resolve(storageDir, row.storage_filename);

    // Defesa em profundidade contra Path Traversal: o caminho deve permanecer no storageDir
    const rel = path.relative(storageDir, resolvedPath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error('Acesso a caminho de arquivo não autorizado');
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error('Arquivo físico não encontrado no armazenamento local');
    }

    return {
      metadata: row,
      absolutePath: resolvedPath,
    };
  }

  /**
   * Lista todos os documentos armazenados, opcionalmente filtrados por response_id
   */
  static listDocuments(responseId?: string): StoredDocumentRow[] {
    const db = getDatabase();
    if (responseId) {
      const stmt = db.prepare('SELECT * FROM stored_documents WHERE response_id = ? ORDER BY created_at DESC');
      return stmt.all(responseId) as StoredDocumentRow[];
    } else {
      const stmt = db.prepare('SELECT * FROM stored_documents ORDER BY created_at DESC');
      return stmt.all() as StoredDocumentRow[];
    }
  }

  /**
   * Exclusão segura de documento (remove arquivo físico e registro no SQLite)
   */
  static deleteDocument(id: string): boolean {
    const docInfo = this.getDocumentById(id);
    if (!docInfo) {
      return false;
    }

    const db = getDatabase();
    db.exec('BEGIN TRANSACTION;');
    try {
      const stmt = db.prepare('DELETE FROM stored_documents WHERE id = ?');
      stmt.run(id);

      if (fs.existsSync(docInfo.absolutePath)) {
        fs.unlinkSync(docInfo.absolutePath);
      }

      db.exec('COMMIT;');
      return true;
    } catch (err) {
      db.exec('ROLLBACK;');
      console.error('[DocumentService] Erro ao excluir documento:', err);
      throw new Error('Erro ao excluir documento');
    }
  }
}
