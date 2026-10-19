import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getDatabase, getDatabasePath, closeDatabase } from '../db/connection';
import { DocumentService } from './documentService';

dotenv.config();

export interface BackupManifest {
  version: string;
  timestamp: string;
  db_sha256: string;
  db_size_bytes: number;
  documents_count: number;
  documents: {
    id: string;
    storage_filename: string;
    sha256: string;
    size_bytes: number;
  }[];
}

export class BackupService {
  static getBackupBaseDir(): string {
    const envDir = process.env.CETY_BACKUP_DIR || 'backups';
    const absDir = path.resolve(process.cwd(), envDir);
    if (!fs.existsSync(absDir)) {
      fs.mkdirSync(absDir, { recursive: true });
    }
    return absDir;
  }

  /**
   * Executa backup consistente do banco SQLite e de todos os documentos PDF
   */
  static createBackup(): {
    backupPath: string;
    manifest: BackupManifest;
  } {
    const db = getDatabase();

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDirName = `backup-${timestampStr}`;
    const backupDir = path.join(this.getBackupBaseDir(), backupDirName);
    fs.mkdirSync(backupDir, { recursive: true });

    // 2. Cria snapshot consistente do banco SQLite (atômico via VACUUM INTO)
    const sourceDbPath = getDatabasePath();
    const targetDbPath = path.join(backupDir, 'cety.sqlite');
    const targetDbSqlPath = targetDbPath.replace(/\\/g, '/');

    try {
      // VACUUM INTO gera um snapshot íntegro, consistente e desfragmentado
      // sem necessidade de bloquear conexões concorrentes
      db.exec(`VACUUM INTO '${targetDbSqlPath}';`);
    } catch (vacErr) {
      console.warn('[BackupService] Aviso: VACUUM INTO falhou, fallback para checkpoint WAL + cópia:', vacErr);
      try {
        db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      } catch (e) {
        console.warn('[BackupService] Aviso ao executar checkpoint WAL:', e);
      }
      fs.copyFileSync(sourceDbPath, targetDbPath);
    }

    const dbBuffer = fs.readFileSync(targetDbPath);
    const dbSha256 = crypto.createHash('sha256').update(dbBuffer).digest('hex');

    // 3. Copia os documentos PDF armazenados
    const storageDir = DocumentService.getStorageDir();
    const targetPdfsDir = path.join(backupDir, 'pdfs');
    fs.mkdirSync(targetPdfsDir, { recursive: true });

    const docRows = DocumentService.listDocuments();
    const manifestDocs: BackupManifest['documents'] = [];

    for (const doc of docRows) {
      const sourcePdfPath = path.join(storageDir, doc.storage_filename);
      if (fs.existsSync(sourcePdfPath)) {
        const targetPdfPath = path.join(targetPdfsDir, doc.storage_filename);
        fs.copyFileSync(sourcePdfPath, targetPdfPath);

        const pdfBuffer = fs.readFileSync(targetPdfPath);
        const actualSha = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

        manifestDocs.push({
          id: doc.id,
          storage_filename: doc.storage_filename,
          sha256: actualSha,
          size_bytes: pdfBuffer.length,
        });
      }
    }

    // 4. Cria o manifesto com assinaturas e metadados de integridade
    const manifest: BackupManifest = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      db_sha256: dbSha256,
      db_size_bytes: dbBuffer.length,
      documents_count: manifestDocs.length,
      documents: manifestDocs,
    };

    const manifestPath = path.join(backupDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log(`[BackupService] Backup concluído com sucesso em: ${backupDir}`);
    return {
      backupPath: backupDir,
      manifest,
    };
  }

  /**
   * Restaura o banco de dados e arquivos a partir de um backup validado
   */
  static restoreBackup(backupDirPath: string): {
    success: boolean;
    restoredDocuments: number;
  } {
    const manifestPath = path.join(backupDirPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Manifesto de backup (manifest.json) não encontrado');
    }

    const manifest: BackupManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // 1. Verifica integridade do arquivo cety.sqlite no backup
    const backupDbPath = path.join(backupDirPath, 'cety.sqlite');
    if (!fs.existsSync(backupDbPath)) {
      throw new Error('Arquivo de banco cety.sqlite não encontrado no backup');
    }

    const backupDbBuffer = fs.readFileSync(backupDbPath);
    const calculatedDbSha = crypto.createHash('sha256').update(backupDbBuffer).digest('hex');
    if (calculatedDbSha !== manifest.db_sha256) {
      throw new Error('Falha de integridade: Hash SHA-256 do SQLite não confere com o manifesto de backup');
    }

    // 2. Fecha conexão ativa do SQLite antes de sobrescrever
    closeDatabase();

    // 3. Restaura o arquivo do banco
    const targetDbPath = getDatabasePath();
    fs.copyFileSync(backupDbPath, targetDbPath);

    // Remove eventuais arquivos WAL residuais
    const walPath = `${targetDbPath}-wal`;
    const shmPath = `${targetDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    // 4. Restaura os arquivos PDF com validação individual de integridade
    const targetStorageDir = DocumentService.getStorageDir();
    const backupPdfsDir = path.join(backupDirPath, 'pdfs');
    let restoredDocs = 0;

    if (fs.existsSync(backupPdfsDir)) {
      for (const docMeta of manifest.documents) {
        const sourceFile = path.join(backupPdfsDir, docMeta.storage_filename);
        if (fs.existsSync(sourceFile)) {
          const buf = fs.readFileSync(sourceFile);
          const sha = crypto.createHash('sha256').update(buf).digest('hex');
          if (sha !== docMeta.sha256) {
            console.warn(`[BackupService] Aviso: Checksum divergente no documento ${docMeta.storage_filename}`);
          }
          const targetFile = path.join(targetStorageDir, docMeta.storage_filename);
          fs.copyFileSync(sourceFile, targetFile);
          restoredDocs++;
        }
      }
    }

    // 5. Reabre conexão SQLite para pronta utilização
    getDatabase();

    console.log(`[BackupService] Restauração concluída com sucesso. Documentos restaurados: ${restoredDocs}`);
    return {
      success: true,
      restoredDocuments: restoredDocs,
    };
  }

  /**
   * Lista todos os backups locais disponíveis
   */
  static listBackups(): {
    name: string;
    path: string;
    timestamp: string;
    documentsCount: number;
  }[] {
    const baseDir = this.getBackupBaseDir();
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });

    return entries
      .filter((e) => e.isDirectory() && e.name.startsWith('backup-'))
      .map((dir) => {
        const dirPath = path.join(baseDir, dir.name);
        const manifestFile = path.join(dirPath, 'manifest.json');
        let timestamp = dir.name.replace('backup-', '');
        let count = 0;
        if (fs.existsSync(manifestFile)) {
          try {
            const m = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
            timestamp = m.timestamp;
            count = m.documents_count || 0;
          } catch {
            // ignore
          }
        }
        return {
          name: dir.name,
          path: dirPath,
          timestamp,
          documentsCount: count,
        };
      })
      .sort((a, b) => b.name.localeCompare(a.name));
  }
}
