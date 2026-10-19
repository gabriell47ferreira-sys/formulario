import { SurveyService } from './services/surveyService';
import { SurveyAnswers, StrategicReport } from '../src/types/survey';
import { runMigrations } from './db/migrations';
import { getDatabase, closeDatabase } from './db/connection';
import { SubmissionRecord, SubmissionSummary } from './types';

// Garante migrações executadas
runMigrations();

export function getAllSubmissions(): SubmissionSummary[] {
  return SurveyService.listResponses();
}

export function getSubmissionById(id: string): SubmissionRecord | null {
  const dto = SurveyService.getResponseById(id);
  if (!dto) return null;

  return {
    id: dto.id,
    createdAt: dto.createdAt,
    status: dto.status,
    hasReport: dto.hasReport,
    reportId: dto.reportId,
    isTestData: dto.isTestData,
    testProfileName: dto.testProfileName,
    answers: dto.answers,
  };
}

export function createSubmission(answers: SurveyAnswers): SubmissionRecord {
  const dto = SurveyService.createResponse(answers);
  return {
    id: dto.id,
    createdAt: dto.createdAt,
    status: dto.status,
    hasReport: false,
    isTestData: dto.isTestData,
    testProfileName: dto.testProfileName,
    answers: dto.answers,
  };
}

export function saveReportForSubmission(submissionId: string, report: StrategicReport): void {
  SurveyService.saveReport(submissionId, report);
}

export function markSubmissionReportError(submissionId: string): void {
  SurveyService.markReportError(submissionId);
}

export function getReportBySubmissionId(submissionId: string): StrategicReport | null {
  return SurveyService.getReport(submissionId);
}

export { getDatabase, closeDatabase, runMigrations };
