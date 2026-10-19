import { getDatabase } from '../db/connection';
import { SurveyResponseRow, SurveyResponseDTO, SurveyResponseSummaryDTO } from '../db/types';
import { SurveyAnswers, StrategicReport, LawArea, TeamStructure, ProcessVolume, TimeSinkOption, AIDesiredOption } from '../../src/types/survey';

export class SurveyService {
  /**
   * Registra uma nova resposta de formulário no SQLite com consulta parametrizada
   */
  static createResponse(answers: SurveyAnswers): SurveyResponseDTO {
    const db = getDatabase();

    // Validações básicas de formato
    if (!answers || typeof answers !== 'object') {
      throw new Error('Respostas inválidas fornecidas');
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const id = `SUB-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;
    const now = new Date().toISOString();

    const area = answers.area === 'Outra' && answers.areaOther
      ? `Outra (${answers.areaOther.trim()})`
      : (answers.area || 'Não informado');

    const teamSize = answers.teamStructure || 'Não informado';
    const caseload = answers.processVolume || 'Não informado';
    const currentTools = answers.toolsUsed?.trim() || null;
    const deadlineMgmt = answers.operationalControl?.trim() || null;
    const mainPainPoint = answers.mainDifficulties?.trim() || null;
    const timeTasksJson = JSON.stringify(answers.timeSinks || []);
    const desiredAuto = answers.desiredAutomation?.trim() || null;
    const desiredAiJson = JSON.stringify(answers.aiCapabilities || []);
    const morningDash = answers.idealDashboard?.trim() || null;
    const taskEliminate = answers.singleTaskToEliminate?.trim() || null;
    const isTestData = answers.isTestData ? 1 : 0;
    const testProfileName = answers.testProfileName || null;

    const stmt = db.prepare(`
      INSERT INTO survey_responses (
        id, practice_area, team_size, caseload, current_tools, deadline_management,
        main_pain_point, time_consuming_tasks, desired_automation, desired_ai_features,
        morning_dashboard, task_to_eliminate, status, report_id, report_data,
        is_test_data, test_profile_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', NULL, NULL, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      area,
      teamSize,
      caseload,
      currentTools,
      deadlineMgmt,
      mainPainPoint,
      timeTasksJson,
      desiredAuto,
      desiredAiJson,
      morningDash,
      taskEliminate,
      isTestData,
      testProfileName,
      now,
      now
    );

    return this.getResponseById(id)!;
  }

  /**
   * Recupera resposta pelo ID com deserialização segura
   */
  static getResponseById(id: string): SurveyResponseDTO | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM survey_responses WHERE id = ?');
    const row = stmt.get(id) as SurveyResponseRow | undefined;

    if (!row) {
      return null;
    }

    return this.rowToDTO(row);
  }

  /**
   * Lista respostas com filtros opcionais parametrizados
   */
  static listResponses(filters?: {
    q?: string;
    area?: string;
    status?: string;
  }): SurveyResponseSummaryDTO[] {
    const db = getDatabase();
    let query = 'SELECT id, practice_area, team_size, caseload, main_pain_point, status, report_id, is_test_data, test_profile_name, created_at FROM survey_responses WHERE 1=1';
    const params: any[] = [];

    if (filters?.area && filters.area !== 'ALL') {
      query += ' AND practice_area LIKE ?';
      params.push(`%${filters.area}%`);
    }

    if (filters?.status && filters.status !== 'ALL') {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.q) {
      query += ' AND (id LIKE ? OR practice_area LIKE ? OR main_pain_point LIKE ? OR test_profile_name LIKE ?)';
      const term = `%${filters.q}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      status: r.status,
      hasReport: Boolean(r.report_id),
      reportId: r.report_id || undefined,
      area: r.practice_area,
      teamStructure: r.team_size,
      processVolume: r.caseload,
      mainDifficultiesPreview: r.main_pain_point
        ? r.main_pain_point.substring(0, 80) + (r.main_pain_point.length > 80 ? '...' : '')
        : 'Não detalhado',
      isTestData: Boolean(r.is_test_data),
      testProfileName: r.test_profile_name || undefined,
    }));
  }

  /**
   * Salva o relatório gerado na linha da submissão
   */
  static saveReport(responseId: string, report: StrategicReport): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE survey_responses
      SET report_id = ?, report_data = ?, status = 'ANALISADO', updated_at = ?
      WHERE id = ?
    `);

    stmt.run(report.id, JSON.stringify(report), now, responseId);
  }

  /**
   * Marca erro de geração do relatório mantendo respostas intactas
   */
  static markReportError(responseId: string): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE survey_responses
      SET status = 'ERRO_ANALISE', updated_at = ?
      WHERE id = ?
    `);

    stmt.run(now, responseId);
  }

  /**
   * Obtém o relatório gerado de uma submissão
   */
  static getReport(responseId: string): StrategicReport | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT report_data FROM survey_responses WHERE id = ?');
    const row = stmt.get(responseId) as { report_data: string | null } | undefined;

    if (!row || !row.report_data) {
      return null;
    }

    try {
      return JSON.parse(row.report_data) as StrategicReport;
    } catch {
      return null;
    }
  }

  /**
   * Consolida métricas estatísticas da base SQLite
   */
  static getStats(): {
    total: number;
    withReport: number;
    pending: number;
    areas: Record<string, number>;
  } {
    const db = getDatabase();

    const totalRow = db.prepare('SELECT COUNT(*) as count FROM survey_responses').get() as { count: number };
    const withReportRow = db.prepare("SELECT COUNT(*) as count FROM survey_responses WHERE status = 'ANALISADO'").get() as { count: number };
    const pendingRow = db.prepare("SELECT COUNT(*) as count FROM survey_responses WHERE status = 'PENDENTE'").get() as { count: number };

    const areasRows = db.prepare('SELECT practice_area, COUNT(*) as count FROM survey_responses GROUP BY practice_area').all() as { practice_area: string; count: number }[];

    const areaMap: Record<string, number> = {};
    areasRows.forEach((r) => {
      const cleanArea = r.practice_area.split('(')[0].trim();
      areaMap[cleanArea] = (areaMap[cleanArea] || 0) + r.count;
    });

    return {
      total: totalRow.count,
      withReport: withReportRow.count,
      pending: pendingRow.count,
      areas: areaMap,
    };
  }

  /**
   * Converte linha do SQLite em SurveyResponseDTO
   */
  private static rowToDTO(row: SurveyResponseRow): SurveyResponseDTO {
    let timeSinks: TimeSinkOption[] = [];
    let aiCapabilities: AIDesiredOption[] = [];
    let reportData: StrategicReport | undefined;

    try {
      timeSinks = JSON.parse(row.time_consuming_tasks || '[]');
    } catch {
      timeSinks = [];
    }

    try {
      aiCapabilities = JSON.parse(row.desired_ai_features || '[]');
    } catch {
      aiCapabilities = [];
    }

    if (row.report_data) {
      try {
        reportData = JSON.parse(row.report_data);
      } catch {
        // ignore
      }
    }

    // Separação de área caso tenha sido "Outra (especificação)"
    let area: LawArea | '' = 'Outra';
    let areaOther = '';
    if (row.practice_area.startsWith('Outra (')) {
      area = 'Outra';
      areaOther = row.practice_area.replace('Outra (', '').replace(/\)$/, '');
    } else {
      area = (row.practice_area as LawArea) || '';
    }

    const answers: SurveyAnswers = {
      area,
      areaOther,
      teamStructure: (row.team_size as TeamStructure) || '',
      processVolume: (row.caseload as ProcessVolume) || '',
      toolsUsed: row.current_tools || '',
      operationalControl: row.deadline_management || '',
      mainDifficulties: row.main_pain_point || '',
      timeSinks,
      desiredAutomation: row.desired_automation || '',
      aiCapabilities,
      idealDashboard: row.morning_dashboard || '',
      singleTaskToEliminate: row.task_to_eliminate || '',
      isTestData: Boolean(row.is_test_data),
      testProfileName: row.test_profile_name || undefined,
    };

    return {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
      hasReport: Boolean(row.report_id),
      reportId: row.report_id || undefined,
      reportData,
      isTestData: Boolean(row.is_test_data),
      testProfileName: row.test_profile_name || undefined,
      answers,
    };
  }
}
