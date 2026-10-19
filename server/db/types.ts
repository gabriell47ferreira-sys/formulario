import { SurveyAnswers, StrategicReport } from '../../src/types/survey';

export interface SurveyResponseRow {
  id: string;
  practice_area: string;
  team_size: string;
  caseload: string;
  current_tools: string | null;
  deadline_management: string | null;
  main_pain_point: string | null;
  time_consuming_tasks: string; // JSON Array
  desired_automation: string | null;
  desired_ai_features: string; // JSON Array
  morning_dashboard: string | null;
  task_to_eliminate: string | null;
  status: 'PENDENTE' | 'ANALISADO' | 'ERRO_ANALISE';
  report_id: string | null;
  report_data: string | null; // JSON String of StrategicReport
  is_test_data: number; // 0 or 1
  test_profile_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoredDocumentRow {
  id: string;
  response_id: string | null;
  original_filename: string;
  storage_filename: string;
  relative_path: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  created_at: string;
}

export interface SurveyResponseDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'PENDENTE' | 'ANALISADO' | 'ERRO_ANALISE';
  hasReport: boolean;
  reportId?: string;
  reportData?: StrategicReport;
  isTestData: boolean;
  testProfileName?: string;
  answers: SurveyAnswers;
}

export interface SurveyResponseSummaryDTO {
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
