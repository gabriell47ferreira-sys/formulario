import { SurveyAnswers, StrategicReport } from '../types/survey';

const DRAFT_STORAGE_KEY = 'antigravity_survey_draft_v1';
const REPORT_STORAGE_KEY = 'antigravity_latest_report_v1';

export interface StorageStatus {
  hasLocalDraft: boolean;
  hasLatestReport: boolean;
  isBackendConnected: boolean;
  backendNotice: string;
}

export function saveDraftAnswers(answers: SurveyAnswers): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(answers));
  } catch (e) {
    console.warn('Não foi possível salvar rascunho localmente no localStorage', e);
  }
}

export function loadDraftAnswers(): SurveyAnswers | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SurveyAnswers;
  } catch (e) {
    console.warn('Erro ao carregar rascunho local', e);
    return null;
  }
}

export function clearDraftAnswers(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    console.warn('Erro ao limpar rascunho local', e);
  }
}

export function saveGeneratedReport(report: StrategicReport): void {
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch (e) {
    console.warn('Erro ao salvar relatório gerado localmente', e);
  }
}

export function loadGeneratedReport(): StrategicReport | null {
  try {
    const raw = localStorage.getItem(REPORT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StrategicReport;
  } catch (e) {
    console.warn('Erro ao carregar relatório salvo', e);
    return null;
  }
}

export function clearGeneratedReport(): void {
  try {
    localStorage.removeItem(REPORT_STORAGE_KEY);
  } catch (e) {
    console.warn('Erro ao remover relatório salvo', e);
  }
}

export function getStorageDiagnostics(): StorageStatus {
  let hasDraft = false;
  let hasReport = false;
  try {
    hasDraft = Boolean(localStorage.getItem(DRAFT_STORAGE_KEY));
    hasReport = Boolean(localStorage.getItem(REPORT_STORAGE_KEY));
  } catch {
    // ignore
  }

  return {
    hasLocalDraft: hasDraft,
    hasLatestReport: hasReport,
    isBackendConnected: false,
    backendNotice: 'Persistência de sessão ativa via navegador local. O armazenamento em nuvem multiusuário dependerá de serviço backend configurado futuramente.',
  };
}
