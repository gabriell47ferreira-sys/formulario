import { SurveyAnswers, StrategicReport } from '../src/types/survey';
import { generateStrategicReport } from '../src/services/reportEngine';
import { SurveyService } from './services/surveyService';

export function processAndSaveReport(submissionId: string, answers: SurveyAnswers): StrategicReport {
  try {
    const report = generateStrategicReport(answers);
    SurveyService.saveReport(submissionId, report);
    return report;
  } catch (error) {
    console.error(`Erro ao gerar relatório para submissão ${submissionId}:`, error);
    SurveyService.markReportError(submissionId);
    throw error;
  }
}
