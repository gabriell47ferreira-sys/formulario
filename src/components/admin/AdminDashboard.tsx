import React, { useState, useEffect, useCallback } from 'react';
import {
  AdminSubmissionItem,
  AdminSubmissionDetail,
  AdminStats,
  fetchAdminSubmissions,
  fetchAdminSubmissionDetail,
  fetchAdminReport,
  generateAdminReport,
  fetchAdminStats,
  clearStoredAdminToken,
} from '../../services/api';
import { StrategicReport } from '../../types/survey';
import { ReportView } from '../ReportView';
import { OriginalAnswersDrawer } from '../OriginalAnswersDrawer';
import {
  Search,
  RefreshCw,
  LogOut,
  FileText,
  Sparkles,
  Layers,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database,
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigateToPublic: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  onNavigateToPublic,
}) => {
  const [submissions, setSubmissions] = useState<AdminSubmissionItem[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal de visualização de submissão individual
  const [activeSubmissionDetail, setActiveSubmissionDetail] = useState<AdminSubmissionDetail | null>(null);
  const [isAnswersDrawerOpen, setIsAnswersDrawerOpen] = useState(false);

  // Visualização de relatório
  const [activeReport, setActiveReport] = useState<StrategicReport | null>(null);
  const [isGeneratingId, setIsGeneratingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [subsRes, statsRes] = await Promise.all([
        fetchAdminSubmissions({
          q: searchQuery,
          area: selectedArea,
          status: selectedStatus,
        }),
        fetchAdminStats(),
      ]);
      setSubmissions(subsRes.submissions);
      setStats(statsRes);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Erro ao carregar dados do servidor.');
    }
  }, [searchQuery, selectedArea, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAnswers = async (id: string) => {
    try {
      const detail = await fetchAdminSubmissionDetail(id);
      setActiveSubmissionDetail(detail);
      setIsAnswersDrawerOpen(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar respostas.');
    }
  };

  const handleOpenReport = async (submissionId: string) => {
    try {
      const report = await fetchAdminReport(submissionId);
      setActiveReport(report);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(err.message || 'Relatório indisponível.');
    }
  };

  const handleGenerateReport = async (submissionId: string) => {
    setIsGeneratingId(submissionId);
    try {
      const report = await generateAdminReport(submissionId);
      setActiveReport(report);
      setIsGeneratingId(null);
      loadData();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setIsGeneratingId(null);
      alert(err.message || 'Erro ao gerar relatório.');
    }
  };

  const handleLogoutClick = () => {
    clearStoredAdminToken();
    onLogout();
  };

  // Se estiver visualizando um relatório aberto
  if (activeReport) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#F5F5F5]">
        <div className="no-print border-b border-[#252529] bg-[#111113]/90 backdrop-blur sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <button
              onClick={() => setActiveReport(null)}
              className="text-xs font-mono text-[#8A8A91] hover:text-[#F5F5F5] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Lista de Submissões</span>
            </button>
            <div className="flex items-center gap-2 text-xs font-mono text-[#8A8A91]">
              <span className="w-2 h-2 rounded-full bg-[#00FF88]" />
              <span>Painel do Administrador</span>
            </div>
          </div>
        </div>

        <ReportView
          report={activeReport}
          onViewOriginalAnswers={() => {
            if (activeSubmissionDetail) {
              setIsAnswersDrawerOpen(true);
            } else {
              // Carrega as respostas pelo ID
              const subId = activeReport.id.replace('REP-', 'SUB-');
              handleOpenAnswers(subId);
            }
          }}
          onEditAnswers={() => {
            alert('A edição direta de respostas de advogados é desabilitada para preservar a integridade das evidências.');
          }}
          onReset={() => setActiveReport(null)}
        />

        {activeSubmissionDetail && (
          <OriginalAnswersDrawer
            isOpen={isAnswersDrawerOpen}
            onClose={() => setIsAnswersDrawerOpen(false)}
            answers={activeSubmissionDetail.answers}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5]">
      {/* Admin Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#252529] bg-[#080808]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#111113] border border-[#252529] flex items-center justify-center text-[#00FF88]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F5]">
                  PAINEL ADMINISTRATIVO // EXCLUSIVO
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20">
                  PRIVADO
                </span>
              </div>
              <p className="text-[11px] text-[#8A8A91] hidden sm:block">
                Consulta de Submissões & Relatórios Estratégicos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onNavigateToPublic}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#8A8A91] hover:text-[#F5F5F5] hover:bg-[#161619] border border-transparent hover:border-[#252529] transition-all"
            >
              Ver Formulário Público
            </button>

            <button
              onClick={handleLogoutClick}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Summary Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-[#111113] border border-[#252529]">
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Total de Respostas Recebidas
              </span>
              <span className="text-2xl font-bold font-mono text-[#F5F5F5]">
                {stats.total}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#111113] border border-[#252529]">
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Relatórios Gerados
              </span>
              <span className="text-2xl font-bold font-mono text-[#00FF88]">
                {stats.withReport}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#111113] border border-[#252529]">
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Aguardando Análise
              </span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                {stats.pending}
              </span>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-2xl bg-[#111113] border border-[#252529] mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A8A91] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID, área, dificuldade ou perfil..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#161619] border border-[#252529] focus:border-[#00FF88] text-xs font-mono text-[#F5F5F5] placeholder:text-[#5A5A62] focus:outline-none transition-colors"
            />
          </div>

          {/* Area Filter */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#161619] border border-[#252529] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#00FF88]"
          >
            <option value="ALL">Todas as Áreas</option>
            <option value="Previdenciário">Previdenciário</option>
            <option value="Trabalhista">Trabalhista</option>
            <option value="Cível">Cível</option>
            <option value="Família e Sucessões">Família e Sucessões</option>
            <option value="Empresarial">Empresarial</option>
            <option value="Criminal">Criminal</option>
            <option value="Tributário">Tributário</option>
            <option value="Outra">Outra</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#161619] border border-[#252529] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#00FF88]"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ANALISADO">Relatório Gerado</option>
            <option value="PENDENTE">Pendente de Análise</option>
            <option value="ERRO_ANALISE">Erro de Análise</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-[#161619] hover:bg-[#1D1D22] border border-[#252529] text-[#8A8A91] hover:text-[#F5F5F5] transition-colors"
            title="Recarregar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submissions List */}
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#111113] border border-[#252529]">
              <Layers className="w-8 h-8 text-[#5A5A62] mx-auto mb-3" />
              <p className="text-sm font-mono text-[#8A8A91]">
                {isLoading ? 'Carregando submissões...' : 'Nenhuma resposta encontrada para os filtros selecionados.'}
              </p>
            </div>
          ) : (
            submissions.map((sub) => {
              const formattedDate = new Date(sub.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl bg-[#111113] border border-[#252529] hover:border-[#36363E] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#F5F5F5]">
                        {sub.id}
                      </span>
                      {sub.isTestData && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {sub.testProfileName || 'DADOS DE TESTE'}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono ${
                          sub.status === 'ANALISADO'
                            ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20'
                            : sub.status === 'PENDENTE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {sub.status === 'ANALISADO' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Relatório Disponível
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Pendente
                          </>
                        )}
                      </span>
                      <span className="text-[11px] font-mono text-[#5A5A62]">
                        · {formattedDate}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#8A8A91]">
                      <span className="text-[#F5F5F5] font-semibold">{sub.area}</span>
                      <span>·</span>
                      <span>Equipe: {sub.teamStructure}</span>
                      <span>·</span>
                      <span>Volume: {sub.processVolume}</span>
                    </div>

                    <p className="text-xs text-[#8A8A91] line-clamp-1">
                      <strong className="text-[#F5F5F5]/80">Dificuldade relatada:</strong> {sub.mainDifficultiesPreview}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#252529]">
                    <button
                      onClick={() => handleOpenAnswers(sub.id)}
                      className="flex-1 md:flex-initial px-3 py-2 rounded-xl bg-[#161619] hover:bg-[#1D1D22] border border-[#252529] text-xs font-mono text-[#F5F5F5] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Consultar respostas literais fornecidas pelo advogado"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#00FF88]" />
                      <span>Respostas</span>
                    </button>

                    {sub.hasReport ? (
                      <button
                        onClick={() => handleOpenReport(sub.id)}
                        className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-[#00FF88] hover:bg-[#00E57A] text-[#080808] text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-[#00FF88]/15 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Abrir Relatório</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateReport(sub.id)}
                        disabled={isGeneratingId === sub.id}
                        className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-[#161619] hover:bg-[#1D1D22] border border-[#00FF88]/40 text-[#00FF88] text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isGeneratingId === sub.id ? 'Gerando...' : 'Gerar Relatório'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Drawer com respostas originais */}
      {activeSubmissionDetail && (
        <OriginalAnswersDrawer
          isOpen={isAnswersDrawerOpen}
          onClose={() => setIsAnswersDrawerOpen(false)}
          answers={activeSubmissionDetail.answers}
        />
      )}
    </div>
  );
};
