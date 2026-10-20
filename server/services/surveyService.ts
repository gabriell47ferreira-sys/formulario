import { getDbClient } from '../db/client';
import { SurveyResponseRow, SurveyResponseDTO, SurveyResponseSummaryDTO } from '../db/types';
import { SurveyAnswers, StrategicReport, LawArea, TeamStructure, ProcessVolume, TimeSinkOption, AIDesiredOption } from '../../src/types/survey';

export class SurveyService {
  /**
   * Registra uma nova resposta de formulário no SQLite / Turso com consulta parametrizada
   */
  static async createResponse(answers: SurveyAnswers): Promise<SurveyResponseDTO> {
    const db = getDbClient();

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

    await db.execute({
      sql: `
        INSERT INTO survey_responses (
          id, practice_area, team_size, caseload, current_tools, deadline_management,
          main_pain_point, time_consuming_tasks, desired_automation, desired_ai_features,
          morning_dashboard, task_to_eliminate, status, report_id, report_data,
          is_test_data, test_profile_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', NULL, NULL, ?, ?, ?, ?)
      `,
      args: [
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
        now,
      ],
    });

    const created = await this.getResponseById(id);
    if (!created) {
      throw new Error('Falha ao recuperar resposta recém-criada');
    }
    return created;
  }

  /**
   * Recupera resposta pelo ID com deserialização segura
   */
  static async getResponseById(id: string): Promise<SurveyResponseDTO | null> {
    const db = getDbClient();
    const res = await db.execute({
      sql: 'SELECT * FROM survey_responses WHERE id = ?',
      args: [id],
    });
    const row = res.rows[0] as unknown as SurveyResponseRow | undefined;

    if (!row) {
      return null;
    }

    return this.rowToDTO(row);
  }

  /**
   * Lista respostas com filtros opcionais parametrizados
   */
  static async listResponses(filters?: {
    q?: string;
    area?: string;
    status?: string;
  }): Promise<SurveyResponseSummaryDTO[]> {
    const db = getDbClient();
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

    const res = await db.execute({
      sql: query,
      args: params,
    });

    return res.rows.map((r: any) => ({
      id: String(r.id),
      createdAt: String(r.created_at),
      status: r.status,
      hasReport: Boolean(r.report_id),
      reportId: r.report_id ? String(r.report_id) : undefined,
      area: String(r.practice_area),
      teamStructure: String(r.team_size),
      processVolume: String(r.caseload),
      mainDifficultiesPreview: r.main_pain_point
        ? String(r.main_pain_point).substring(0, 80) + (String(r.main_pain_point).length > 80 ? '...' : '')
        : 'Não detalhado',
      isTestData: Boolean(r.is_test_data),
      testProfileName: r.test_profile_name ? String(r.test_profile_name) : undefined,
    }));
  }

  /**
   * Salva o relatório gerado na linha da submissão
   */
  static async saveReport(responseId: string, report: StrategicReport): Promise<void> {
    const db = getDbClient();
    const now = new Date().toISOString();
    await db.execute({
      sql: `
        UPDATE survey_responses
        SET report_id = ?, report_data = ?, status = 'ANALISADO', updated_at = ?
        WHERE id = ?
      `,
      args: [report.id, JSON.stringify(report), now, responseId],
    });
  }

  /**
   * Marca erro de geração do relatório mantendo respostas intactas
   */
  static async markReportError(responseId: string): Promise<void> {
    const db = getDbClient();
    const now = new Date().toISOString();
    await db.execute({
      sql: `
        UPDATE survey_responses
        SET status = 'ERRO_ANALISE', updated_at = ?
        WHERE id = ?
      `,
      args: [now, responseId],
    });
  }

  /**
   * Obtém o relatório gerado de uma submissão
   */
  static async getReport(responseId: string): Promise<StrategicReport | null> {
    const db = getDbClient();
    const res = await db.execute({
      sql: 'SELECT report_data FROM survey_responses WHERE id = ?',
      args: [responseId],
    });
    const row = res.rows[0] as { report_data: string | null } | undefined;

    if (!row || !row.report_data) {
      return null;
    }

    try {
      return JSON.parse(String(row.report_data)) as StrategicReport;
    } catch {
      return null;
    }
  }

  /**
   * Consolida métricas estatísticas da base SQLite / Turso
   */
  static async getStats(): Promise<{
    total: number;
    withReport: number;
    pending: number;
    areas: Record<string, number>;
  }> {
    const db = getDbClient();

    const totalRes = await db.execute('SELECT COUNT(*) as count FROM survey_responses');
    const withReportRes = await db.execute("SELECT COUNT(*) as count FROM survey_responses WHERE status = 'ANALISADO'");
    const pendingRes = await db.execute("SELECT COUNT(*) as count FROM survey_responses WHERE status = 'PENDENTE'");
    const areasRes = await db.execute('SELECT practice_area, COUNT(*) as count FROM survey_responses GROUP BY practice_area');

    const totalCount = Number(totalRes.rows[0]?.count || 0);
    const withReportCount = Number(withReportRes.rows[0]?.count || 0);
    const pendingCount = Number(pendingRes.rows[0]?.count || 0);

    const areaMap: Record<string, number> = {};
    areasRes.rows.forEach((r: any) => {
      const rawArea = String(r.practice_area || '');
      const cleanArea = rawArea.split('(')[0].trim();
      areaMap[cleanArea] = (areaMap[cleanArea] || 0) + Number(r.count || 0);
    });

    return {
      total: totalCount,
      withReport: withReportCount,
      pending: pendingCount,
      areas: areaMap,
    };
  }

  /**
   * Converte linha do SQLite em SurveyResponseDTO
   */
  private static rowToDTO(row: any): SurveyResponseDTO {
    let timeSinks: TimeSinkOption[] = [];
    let aiCapabilities: AIDesiredOption[] = [];
    let reportData: StrategicReport | undefined;

    try {
      timeSinks = JSON.parse(String(row.time_consuming_tasks || '[]'));
    } catch {
      timeSinks = [];
    }

    try {
      aiCapabilities = JSON.parse(String(row.desired_ai_features || '[]'));
    } catch {
      aiCapabilities = [];
    }

    if (row.report_data) {
      try {
        reportData = JSON.parse(String(row.report_data));
      } catch {
        // ignore
      }
    }

    // Separação de área caso tenha sido "Outra (especificação)"
    const rawArea = String(row.practice_area || '');
    let area: LawArea | '' = 'Outra';
    let areaOther = '';
    if (rawArea.startsWith('Outra (')) {
      area = 'Outra';
      areaOther = rawArea.replace('Outra (', '').replace(/\)$/, '');
    } else {
      area = (rawArea as LawArea) || '';
    }

    const answers: SurveyAnswers = {
      area,
      areaOther,
      teamStructure: (row.team_size as TeamStructure) || '',
      processVolume: (row.caseload as ProcessVolume) || '',
      toolsUsed: row.current_tools ? String(row.current_tools) : '',
      operationalControl: row.deadline_management ? String(row.deadline_management) : '',
      mainDifficulties: row.main_pain_point ? String(row.main_pain_point) : '',
      timeSinks,
      desiredAutomation: row.desired_automation ? String(row.desired_automation) : '',
      aiCapabilities,
      idealDashboard: row.morning_dashboard ? String(row.morning_dashboard) : '',
      singleTaskToEliminate: row.task_to_eliminate ? String(row.task_to_eliminate) : '',
      isTestData: Boolean(row.is_test_data),
      testProfileName: row.test_profile_name ? String(row.test_profile_name) : undefined,
    };

    return {
      id: String(row.id),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      status: row.status,
      hasReport: Boolean(row.report_id),
      reportId: row.report_id ? String(row.report_id) : undefined,
      reportData,
      isTestData: Boolean(row.is_test_data),
      testProfileName: row.test_profile_name ? String(row.test_profile_name) : undefined,
      answers,
    };
  }
}
