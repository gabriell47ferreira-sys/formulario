import React, { useState } from 'react';
import { StrategicReport, EvidenceType } from '../types/survey';
import {
  Download,
  Loader2,
  FileText,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Cpu,
  LayoutDashboard,
  Target,
  Compass,
} from 'lucide-react';

interface ReportViewProps {
  report: StrategicReport;
  onViewOriginalAnswers: () => void;
  onEditAnswers: () => void;
  onReset: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  report,
  onViewOriginalAnswers,
  onEditAnswers,
  onReset,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-printable-content');
    if (!element) return;

    setIsDownloading(true);

    try {
      const html2pdf = (window as any).html2pdf;
      if (html2pdf) {
        const cleanId = report.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `Relatorio_Diagnostico_${cleanId}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#080808',
            scrollY: 0,
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait',
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };

        await html2pdf().set(opt).from(element).save();
      } else {
        // Fallback para impressão se biblioteca não carregada
        window.print();
      }
    } catch (err) {
      console.error('Erro ao gerar download do PDF:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const renderEvidenceBadge = (type: EvidenceType) => {
    switch (type) {
      case 'Relatado':
        return (
          <span className="report-badge-relatado inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30">
            <CheckCircle className="w-3 h-3" />
            Relatado
          </span>
        );
      case 'Hipótese':
        return (
          <span className="report-badge-hipotese inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <HelpCircle className="w-3 h-3" />
            Hipótese
          </span>
        );
      case 'Recomendação':
        return (
          <span className="report-badge-recomendacao inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30">
            <Sparkles className="w-3 h-3" />
            Recomendação
          </span>
        );
    }
  };

  return (
    <div className="report-container max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-14 text-[#F5F5F5]">
      {/* Test Data Warning Banner */}
      {report.isTestData && (
        <div className="no-print mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs font-mono text-amber-300 leading-relaxed">
            <strong className="font-bold uppercase tracking-wider block mb-1">
              [DADOS DE TESTE DEMONSTRATIVOS] {report.testProfileName && `— ${report.testProfileName}`}
            </strong>
            Este relatório foi gerado utilizando um perfil simulado de testes para validação da metodologia e do algoritmo analítico. As informações não constituem respostas de um advogado real.
          </div>
        </div>
      )}

      {/* Action Bar (Top) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-10 pb-6 border-b border-[#252529]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#8A8A91]">
            Documento: <strong className="text-[#F5F5F5]">{report.id}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onViewOriginalAnswers}
            className="px-3.5 py-2 rounded-lg bg-[#111113] hover:bg-[#161619] border border-[#252529] hover:border-[#36363E] text-xs font-mono text-[#F5F5F5] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#00FF88]" />
            <span>Consultar Respostas Originais</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-3.5 py-2 rounded-lg bg-[#00FF88] hover:bg-[#00E57A] text-[#080808] text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-[#00FF88]/20 cursor-pointer disabled:opacity-50"
            title="Baixar relatório em PDF diretamente"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </>
            )}
          </button>

          <button
            onClick={onEditAnswers}
            className="px-3 py-2 rounded-lg bg-[#111113] hover:bg-[#161619] border border-[#252529] text-xs font-mono text-[#8A8A91] hover:text-[#F5F5F5] transition-all"
            title="Ajustar respostas do formulário"
          >
            Editar Respostas
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-[#111113] hover:bg-[#161619] border border-[#252529] text-[#8A8A91] hover:text-[#F5F5F5] transition-all"
            title="Iniciar nova pesquisa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable Report Wrapper for Direct PDF Download */}
      <div id="report-printable-content" className="p-1 sm:p-2">
        {/* Document Header */}
        <header className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded text-[11px] font-mono tracking-widest uppercase bg-[#111113] border border-[#252529] text-[#8A8A91]">
            DIAGNÓSTICO ESTRATÉGICO // PRODUTO & SAAS
          </span>
          <span className="text-xs font-mono text-[#5A5A62]">· {report.generatedAt}</span>
        </div>

        <h1 className="report-text-primary text-2xl sm:text-4xl font-bold tracking-tight text-[#F5F5F5] mb-3 leading-tight uppercase font-mono">
          RELATÓRIO DE DIAGNÓSTICO OPERACIONAL JURÍDICO
        </h1>

        <p className="report-text-secondary text-sm sm:text-base text-[#8A8A91] max-w-3xl leading-relaxed">
          Análise da rotina, dificuldades e oportunidades de melhoria identificadas a partir das respostas do profissional.
        </p>

        {/* Legend of Evidence Badges */}
        <div className="mt-6 pt-4 border-t border-[#252529]/80 flex flex-wrap items-center gap-4 text-xs font-mono text-[#8A8A91]">
          <span className="text-[#5A5A62]">Classificação de Evidências:</span>
          <div className="flex items-center gap-1.5">
            {renderEvidenceBadge('Relatado')}
            <span className="text-[11px] text-[#8A8A91]">= Dado explicitamente informado</span>
          </div>
          <div className="flex items-center gap-1.5">
            {renderEvidenceBadge('Hipótese')}
            <span className="text-[11px] text-[#8A8A91]">= Interpretação a confirmar</span>
          </div>
          <div className="flex items-center gap-1.5">
            {renderEvidenceBadge('Recomendação')}
            <span className="text-[11px] text-[#8A8A91]">= Proposta para o produto</span>
          </div>
        </div>
      </header>

      {/* Resumo Executivo Card */}
      <section className="report-card p-6 sm:p-8 rounded-2xl bg-[#111113] border border-[#252529] mb-12 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-5 h-5 text-[#00FF88]" />
          <h2 className="report-text-primary text-xs font-mono uppercase tracking-widest text-[#00FF88] font-bold">
            Resumo Executivo
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Perfil do Escritório
              </span>
              <p className="report-text-primary font-medium text-[#F5F5F5]">
                {report.executiveSummary.officeProfile}
              </p>
            </div>

            <div>
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Necessidade Operacional Mais Relevante
              </span>
              <p className="report-text-primary text-[#F5F5F5]/90 leading-relaxed">
                {report.executiveSummary.coreOperationalNeed}
              </p>
            </div>

            <div>
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Principal Oportunidade de Melhoria
              </span>
              <p className="report-text-primary text-[#F5F5F5]/90 leading-relaxed">
                {report.executiveSummary.mainImprovementOpportunity}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Oportunidade de IA Mais Promissora
              </span>
              <p className="report-text-primary text-[#F5F5F5]/90 leading-relaxed">
                {report.executiveSummary.mostPromisingAIOpportunity}
              </p>
            </div>

            <div>
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Primeiro Passo Recomendado (MVP)
              </span>
              <p className="report-text-primary font-semibold text-[#00FF88]">
                {report.executiveSummary.recommendedFirstStep}
              </p>
            </div>

            <div>
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Hipóteses a Validar com o Profissional
              </span>
              <ul className="text-xs text-[#8A8A91] list-disc list-inside space-y-1">
                {report.executiveSummary.unvalidatedPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* AS 8 SEÇÕES DO RELATÓRIO */}
      <div className="space-y-12">
        {/* ========================================================
            SEÇÃO 1 — PERFIL PROFISSIONAL
           ======================================================== */}
        <section className="report-card p-6 sm:p-8 rounded-2xl bg-[#111113] border border-[#252529]">
          <div className="flex items-center justify-between mb-4 border-b border-[#252529]/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00FF88] font-bold">01</span>
              <h3 className="report-text-primary text-base sm:text-lg font-bold tracking-tight text-[#F5F5F5] uppercase font-mono">
                SEÇÃO 1 — PERFIL PROFISSIONAL
              </h3>
            </div>
            {renderEvidenceBadge('Relatado')}
          </div>

          <p className="report-text-secondary text-sm text-[#8A8A91] mb-6 leading-relaxed">
            {report.section1_Profile.profileSummary}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#161619] border border-[#252529]">
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Área de Atuação
              </span>
              <span className="report-text-primary text-base font-semibold text-[#F5F5F5]">
                {report.section1_Profile.mainArea}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#161619] border border-[#252529]">
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Tamanho da Equipe
              </span>
              <span className="report-text-primary text-base font-semibold text-[#F5F5F5]">
                {report.section1_Profile.teamSize}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#161619] border border-[#252529]">
              <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
                Volume de Processos/Clientes
              </span>
              <span className="report-text-primary text-base font-semibold text-[#F5F5F5]">
                {report.section1_Profile.volume}
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 2 — ESTRUTURA DE TRABALHO ATUAL
           ======================================================== */}
        <section className="report-card p-6 sm:p-8 rounded-2xl bg-[#111113] border border-[#252529]">
          <div className="flex items-center justify-between mb-4 border-b border-[#252529]/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00FF88] font-bold">02</span>
              <h3 className="report-text-primary text-base sm:text-lg font-bold tracking-tight text-[#F5F5F5] uppercase font-mono">
                SEÇÃO 2 — ESTRUTURA DE TRABALHO ATUAL
              </h3>
            </div>
            <div className="flex gap-2">
              {renderEvidenceBadge('Relatado')}
              {renderEvidenceBadge('Hipótese')}
            </div>
          </div>

          <p className="report-text-secondary text-sm text-[#8A8A91] mb-6 leading-relaxed">
            {report.section2_WorkStructure.summary}
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#161619] border border-[#252529]">
              <div className="flex items-center gap-2 mb-2">
                {renderEvidenceBadge('Relatado')}
                <span className="text-xs font-mono text-[#8A8A91] uppercase">
                  Dados Explicitamente Informados
                </span>
              </div>
              <ul className="text-sm text-[#F5F5F5] space-y-2 list-disc list-inside">
                {report.section2_WorkStructure.explicitData.map((d, i) => (
                  <li key={i} className="leading-relaxed">{d}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#161619]/60 border border-[#252529]">
              <div className="flex items-center gap-2 mb-2">
                {renderEvidenceBadge('Hipótese')}
                <span className="text-xs font-mono text-[#8A8A91] uppercase">
                  Interpretação Cautelosa da Rotina
                </span>
              </div>
              <ul className="text-sm text-[#8A8A91] space-y-2 list-disc list-inside">
                {report.section2_WorkStructure.cautiousInterpretations.map((ci, i) => (
                  <li key={i} className="leading-relaxed">{ci}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 3 — PRINCIPAIS DIFICULDADES
           ======================================================== */}
        <section className="report-card p-6 sm:p-8 rounded-2xl bg-[#111113] border border-[#252529]">
          <div className="flex items-center justify-between mb-4 border-b border-[#252529]/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00FF88] font-bold">03</span>
              <h3 className="report-text-primary text-base sm:text-lg font-bold tracking-tight text-[#F5F5F5] uppercase font-mono">
                SEÇÃO 3 — PRINCIPAIS DIFICULDADES
              </h3>
            </div>
            {renderEvidenceBadge('Relatado')}
          </div>

          <p className="report-text-secondary text-sm text-[#8A8A91] mb-6 leading-relaxed">
            {report.section3_Difficulties.synthesis}
          </p>

          <div className="space-y-4">
            {report.section3_Difficulties.items.map((diff, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#161619] border border-[#252529] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#8A8A91] uppercase">
                    Dificuldade #{idx + 1}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono ${
                      diff.evidenceGrade === 'Relato explícito'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {diff.evidenceGrade}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono text-[#8A8A91] block mb-0.5">
                    Problema Relatado:
                  </span>
                  <p className="report-text-primary text-sm font-medium text-[#F5F5F5]">
                    {diff.problemReported}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-mono text-[#8A8A91] block mb-0.5">
                    Impacto Potencial Fundamentado:
                  </span>
                  <p className="report-text-secondary text-xs sm:text-sm text-[#8A8A91]">
                    {diff.potentialImpact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 4 — OPORTUNIDADES DE MELHORIA
           ======================================================== */}
        <section className="report-card p-6 sm:p-8 rounded-2xl bg-[#111113] border border-[#252529]">
          <div className="flex items-center justify-between mb-4 border-b border-[#252529]/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00FF88] font-bold">04</span>
              <h3 className="report-text-primary text-base sm:text-lg font-bold tracking-tight text-[#F5F5F5] uppercase font-mono">
                SEÇÃO 4 — OPORTUNIDADES DE MELHORIA
              </h3>
            </div>
            {renderEvidenceBadge('Recomendação')}
          </div>

          <p className="report-text-secondary text-sm text-[#8A8A91] mb-6 leading-relaxed">
            {report.section4_Improvements.synthesis}
          </p>

          <div className="grid grid-cols-1 gap-4">
            {report.section4_Improvements.items.map((opp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#161619] border border-[#252529] space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono text-[#00FF88] font-bold">
                    Oportunidade #{idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#111113] text-[#8A8A91] border border-[#252529]">
                    Viabilidade: <strong className="text-[#F5F5F5]">{opp.feasibility}</strong>
                  </span>
                </div>

                <div>
                  <span className="text-xs font-mono text-[#8A8A91] block mb-0.5">
                    Problema Relacionado:
                  </span>
                  <p className="report-text-secondary text-xs sm:text-sm text-[#8A8A91]">
                    {opp.relatedProblem}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-mono text-[#8A8A91] block mb-0.5">
                    Solução Sugerida:
                  </span>
                  <p className="report-text-primary text-sm font-semibold text-[#F5F5F5]">
                    {opp.suggestedSolution}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#252529]/60">
                  <div>
                    <span className="text-xs font-mono text-[#8A8A91] block mb-0.5">
                      Benefício Esperado:
                    </span>
                    <p className="text-xs text-[#8A8A91]">{opp.expectedBenefit}</p>
                  </div>
                  <div>
                    <span className="text-xs font-mono text-[#8A8A91] block mb-0.5">
                      Evidência Justificadora:
                    </span>
                    <p className="text-xs text-[#8A8A91] italic">{opp.justifyingEvidence}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 5 — OPORTUNIDADES DE INTELIGÊNCIA ARTIFICIAL
           ======================================================== */}
        <section className="report-card p-6 sm:p-8 rounded-2xl bg-[#111113] border border-[#252529]">
          <div className="flex items-center justify-between mb-4 border-b border-[#252529]/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00FF88] font-bold">05</span>
              <h3 className="report-text-primary text-base sm:text-lg font-bold tracking-tight text-[#F5F5F5] uppercase font-mono">
                SEÇÃO 5 — OPORTUNIDADES DE INTELIGÊNCIA ARTIFICIAL
              </h3>
            </div>
            <div className="flex gap-2">
              {renderEvidenceBadge('Relatado')}
              {renderEvidenceBadge('Recomendação')}
            </div>
          </div>

          {/* Governance Notice */}
          <div className="p-4 rounded-xl bg-[#00FF88]/5 border border-[#00FF88]/20 mb-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#00FF88] shrink-0 mt-0.5" />
            <p className="text-xs font-mono text-[#8A8A91] leading-relaxed">
              <strong className="text-[#00FF88] block mb-0.5">
                Diretriz Ética e de Responsabilidade Técnica:
              </strong>
              {report.section5_AIOpportunities.governanceDisclaimer}
            </p>
          </div>

          <div className="space-y-4">
            {report.section5_AIOpportunities.items.map((ai, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#161619] border border-[#252529] space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#00FF88]" />
                    <span className="report-text-primary text-sm font-semibold text-[#F5F5F5]">
                      {ai.suggestedAIApplication}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      ai.sourceType === 'Solicitado pelo advogado'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30'
                    }`}
                  >
                    {ai.sourceType}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-xs font-mono text-[#8A8A91]">Necessidade Identificada:</span>
                  <p className="text-[#8A8A91]">{ai.identifiedNeed}</p>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-xs font-mono text-[#8A8A91]">Benefício Esperado:</span>
                  <p className="text-[#8A8A91]">{ai.expectedBenefit}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#252529]/60 text-xs">
                  <div>
                    <span className="font-mono text-amber-400 block mb-0.5">
                      Limitações e Cuidados Técnicos:
                    </span>
                    <p className="text-[#8A8A91] leading-relaxed">{ai.limitationsAndCare}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[#00FF88] block mb-0.5">
                      Exigência de Supervisão Humana:
                    </span>
                    <p className="text-[#8A8A91] leading-relaxed">{ai.humanSupervisionRequirement}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 6 — DASHBOARD IDEAL
           ======================================================== */}
        <section className="report-card p-6 sm:p-8 rounded-2xl bg-[#111113] border border-[#252529]">
          <div className="flex items-center justify-between mb-4 border-b border-[#252529]/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00FF88] font-bold">06</span>
              <h3 className="report-text-primary text-base sm:text-lg font-bold tracking-tight text-[#F5F5F5] uppercase font-mono">
                SEÇÃO 6 — DASHBOARD IDEAL
              </h3>
            </div>
            {renderEvidenceBadge('Recomendação')}
          </div>

          <p className="report-text-secondary text-sm text-[#8A8A91] mb-6 leading-relaxed">
            {report.section6_IdealDashboard.summary}
          </p>

          <div className="mb-6 p-4 rounded-xl bg-[#161619] border border-[#252529]">
            <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-1">
              Elementos Solicitados Explicitamente (Pergunta 10):
            </span>
            <p className="report-text-primary text-sm font-mono text-[#F5F5F5]">
              "{report.section6_IdealDashboard.explicitRequests.join(' ')}"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.section6_IdealDashboard.recommendedWidgets.map((widget, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#161619] border border-[#252529] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#00FF88]" />
                    <span className="report-text-primary text-xs font-bold font-mono text-[#F5F5F5]">
                      {widget.name}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      widget.source === 'Solicitado explicitamente'
                        ? 'bg-sky-500/10 text-sky-400'
                        : 'bg-[#252529] text-[#8A8A91]'
                    }`}
                  >
                    {widget.source}
                  </span>
                </div>
                <p className="text-xs text-[#8A8A91] leading-relaxed">
                  {widget.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 7 — RECOMENDAÇÕES PARA O DESENVOLVIMENTO DO SaaS
           ======================================================== */}
        <section className="report-card p-6 sm:p-8 rounded-2xl bg-[#111113] border border-[#252529]">
          <div className="flex items-center justify-between mb-4 border-b border-[#252529]/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00FF88] font-bold">07</span>
              <h3 className="report-text-primary text-base sm:text-lg font-bold tracking-tight text-[#F5F5F5] uppercase font-mono">
                SEÇÃO 7 — RECOMENDAÇÕES PARA O DESENVOLVIMENTO DO SAAS
              </h3>
            </div>
            {renderEvidenceBadge('Recomendação')}
          </div>

          <div className="p-4 rounded-xl bg-[#161619] border border-[#252529] mb-8">
            <span className="text-xs font-mono text-[#00FF88] uppercase block mb-1 font-semibold">
              Proposta de MVP Síntese:
            </span>
            <p className="report-text-primary text-sm text-[#F5F5F5]/90 leading-relaxed">
              {report.section7_SaaSRecommendations.mvpProposalSummary}
            </p>
          </div>

          {/* Subseção A: MVP */}
          <div className="mb-8">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#F5F5F5] font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00FF88]" />
              <span>A. Funcionalidades Essenciais da Primeira Versão (MVP)</span>
            </h4>
            <div className="space-y-3">
              {report.section7_SaaSRecommendations.mvpFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#161619] border border-[#252529] space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="report-text-primary text-sm font-semibold text-[#F5F5F5]">
                      {feat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20">
                        Prioridade: {feat.priority}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111113] text-[#8A8A91] border border-[#252529]">
                        Complexidade: {feat.complexity}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#8A8A91]">
                    <strong className="text-[#F5F5F5]">Problema que resolve:</strong> {feat.problemSolved}
                  </p>
                  <p className="text-xs text-[#8A8A91] font-mono italic">
                    Evidência: {feat.evidence}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Subseção B: Evoluções Futuras */}
          <div className="mb-8">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#F5F5F5] font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8A8A91]" />
              <span>B. Funcionalidades para Ciclos Posteriores (Pós-Validação)</span>
            </h4>
            <ul className="text-sm text-[#8A8A91] space-y-2 list-disc list-inside bg-[#161619] p-4 rounded-xl border border-[#252529]">
              {report.section7_SaaSRecommendations.futureEvolutions.map((fut, idx) => (
                <li key={idx} className="leading-relaxed">{fut}</li>
              ))}
            </ul>
          </div>

          {/* Subseção C: Simplificação da Experiência */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#F5F5F5] font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00FF88]" />
              <span>C. Diretrizes para Simplificação da Experiência</span>
            </h4>
            <div className="space-y-2">
              {report.section7_SaaSRecommendations.simplificationGuidelines.map((guide, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#161619]/60 border border-[#252529] text-xs text-[#8A8A91] leading-relaxed"
                >
                  {guide}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================
            SEÇÃO 8 — CONCLUSÃO
           ======================================================== */}
        <section className="report-card p-6 sm:p-8 rounded-2xl bg-[#111113] border border-[#00FF88]/30 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-[#252529]/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00FF88] font-bold">08</span>
              <h3 className="report-text-primary text-base sm:text-lg font-bold tracking-tight text-[#00FF88] uppercase font-mono">
                SEÇÃO 8 — CONCLUSÃO
              </h3>
            </div>
            {renderEvidenceBadge('Recomendação')}
          </div>

          <p className="report-text-primary text-sm font-medium text-[#F5F5F5] mb-4 leading-relaxed">
            {report.section8_Conclusion.officeContext}
          </p>

          <div className="p-4 rounded-xl bg-[#161619] border border-[#252529] mb-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#8A8A91] uppercase">
                Foco Primário Imediato:
              </span>
              <span className="text-xs font-mono text-[#00FF88] font-semibold">
                {report.section8_Conclusion.immediateNextStep}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-xs font-mono text-[#8A8A91] uppercase block mb-2">
              Checklist de Validação com o Usuário Antes do Código:
            </span>
            <ul className="text-xs text-[#8A8A91] space-y-1.5 list-disc list-inside">
              {report.section8_Conclusion.validationChecklist.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-[#252529] text-xs text-[#8A8A91] leading-relaxed italic">
            "{report.section8_Conclusion.finalStatement}"
          </div>
        </section>
      </div>
      </div>

      {/* Action Bar (Bottom) */}
      <div className="no-print mt-12 pt-8 border-t border-[#252529] flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs font-mono text-[#8A8A91]">
          Relatório gerado pela ferramenta de Pesquisa Jurídica Antigravity.
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="px-5 py-2.5 rounded-lg bg-[#00FF88] hover:bg-[#00E57A] text-[#080808] text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-lg shadow-[#00FF88]/15 cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar PDF</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="px-4 py-2.5 rounded-lg bg-[#111113] hover:bg-[#161619] border border-[#252529] text-[#8A8A91] hover:text-[#F5F5F5] text-xs font-mono transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nova Pesquisa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
