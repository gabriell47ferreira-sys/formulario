import { SurveyAnswers, StrategicReport } from '../src/types/survey';
import { generateStrategicReport } from '../src/services/reportEngine';
import { SurveyService } from './services/surveyService';

export async function processAndSaveReport(submissionId: string, answers: SurveyAnswers): Promise<StrategicReport> {
  try {
    const report = generateStrategicReport(answers);
    await SurveyService.saveReport(submissionId, report);
    return report;
  } catch (error) {
    console.error(`Erro ao gerar relatório para submissão ${submissionId}:`, error);
    await SurveyService.markReportError(submissionId);
    throw error;
  }
}
