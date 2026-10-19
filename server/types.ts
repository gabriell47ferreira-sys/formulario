import { SurveyAnswers, StrategicReport } from '../src/types/survey';

export interface SubmissionRecord {
  id: string; // e.g. "SUB-20261019-ABCD"
  createdAt: string;
  ipHash?: string;
  status: 'PENDENTE' | 'ANALISADO' | 'ERRO_ANALISE';
  hasReport: boolean;
  reportId?: string;
  isTestData?: boolean;
  testProfileName?: string;
  answers: SurveyAnswers;
}

export interface SubmissionSummary {
  id: string;
  createdAt: string;
  status: 'PENDENTE' | 'ANALISADO' | 'ERRO_ANALISE';
  hasReport: boolean;
  reportId?: string;
  area: string;
  teamStructure: string;
  processVolume: string;
  mainDifficultiesPreview: string;
  isTestData?: boolean;
  testProfileName?: string;
}

export interface DatabaseSchema {
  submissions: Record<string, SubmissionRecord>;
  reports: Record<string, StrategicReport>;
}
