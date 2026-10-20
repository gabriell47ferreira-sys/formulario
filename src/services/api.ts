import { SurveyAnswers, StrategicReport } from '../types/survey';

const TOKEN_KEY = 'antigravity_admin_token_v1';

export function getStoredAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface SubmissionResponse {
  success: boolean;
  submissionId: string;
  message: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  username: string;
  role: string;
  expiresIn: string;
}

export interface AdminSubmissionItem {
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

export interface AdminSubmissionDetail {
  id: string;
  createdAt: string;
  status: 'PENDENTE' | 'ANALISADO' | 'ERRO_ANALISE';
  hasReport: boolean;
  reportId?: string;
  isTestData?: boolean;
  testProfileName?: string;
  answers: SurveyAnswers;
}

export interface AdminStats {
  total: number;
  withReport: number;
  pending: number;
  areas: Record<string, number>;
}

// URL base da API configurável por variável de ambiente para Vercel / Produção
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// -----------------------------------------------------------------
// 1. ÁREA PÚBLICA — ENVIO DO FORMULÁRIO DO ADVOGADO
// -----------------------------------------------------------------
export async function submitPublicSurvey(answers: SurveyAnswers): Promise<SubmissionResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Falha ao registrar respostas no servidor.');
    }

    return response.json();
  } catch (error: any) {
    // Tratamento resiliente caso o computador/backend local esteja offline quando acessado via Vercel
    if (
      error.name === 'TypeError' ||
      error.message?.includes('fetch') ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('Failed to fetch')
    ) {
      throw new Error(
        'O servidor seguro de processamento da 4CETY está offline ou indisponível no momento. ' +
        'Suas respostas foram salvas com segurança no seu navegador como rascunho. ' +
        'Por favor, tente enviar novamente em instantes.'
      );
    }
    throw error;
  }
}

// -----------------------------------------------------------------
// 2. ÁREA ADMINISTRATIVA — MÉTODOS PROTEGIDOS
// -----------------------------------------------------------------
function getAuthHeaders(): HeadersInit {
  const token = getStoredAdminToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || ''}`,
  };
}

export async function loginAdmin(username: string, password: string): Promise<AdminLoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error(err.message || 'Credenciais inválidas. Verifique o usuário e a senha.');
      } else if (response.status === 404) {
        if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
          throw new Error('Você está acessando pela Vercel na nuvem. Como o banco de dados é local, acesse o painel no seu computador em: http://localhost:5173/admin');
        }
        throw new Error('Servidor backend local não encontrado (404). Certifique-se de que o backend local está em execução (npm run dev).');
      } else if (response.status === 429) {
        throw new Error(err.message || 'Muitas tentativas de login. Aguarde alguns instantes antes de tentar novamente.');
      }
      throw new Error(err.message || `Erro de autenticação no servidor (${response.status}).`);
    }

    const data: AdminLoginResponse = await response.json();
    setStoredAdminToken(data.token);
    return data;
  } catch (error: any) {
    if (
      error.name === 'TypeError' ||
      error.message?.includes('NetworkError') ||
      error.message?.includes('Failed to fetch')
    ) {
      throw new Error(
        'Não foi possível conectar ao servidor backend local. Verifique se o backend está iniciado no computador (npm run dev).'
      );
    }
    throw error;
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/admin/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
  } catch {
    // ignore
  } finally {
    clearStoredAdminToken();
  }
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Falha ao alterar senha.');
  }

  return data;
}

export async function verifyAdminSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchAdminSubmissions(params?: {
  q?: string;
  area?: string;
  status?: string;
}): Promise<{ total: number; submissions: AdminSubmissionItem[] }> {
  const query = new URLSearchParams();
  if (params?.q) query.append('q', params.q);
  if (params?.area) query.append('area', params.area);
  if (params?.status) query.append('status', params.status);

  const response = await fetch(`${API_BASE_URL}/api/admin/submissions?${query.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearStoredAdminToken();
      throw new Error('Sessão administrativa expirada ou não autorizada.');
    }
    throw new Error('Erro ao listar submissões.');
  }

  return response.json();
}

export async function fetchAdminSubmissionDetail(id: string): Promise<AdminSubmissionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/admin/submissions/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Erro ao carregar detalhes da submissão.');
  }

  return response.json();
}

export async function fetchAdminReport(id: string): Promise<StrategicReport> {
  const response = await fetch(`${API_BASE_URL}/api/admin/submissions/${id}/report`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Relatório indisponível.');
  }

  return response.json();
}

export async function generateAdminReport(id: string): Promise<StrategicReport> {
  const response = await fetch(`${API_BASE_URL}/api/admin/submissions/${id}/generate-report`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Erro ao gerar relatório.');
  }

  const data = await response.json();
  return data.report;
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Erro ao obter estatísticas.');
  }

  return response.json();
}
