import React from 'react';
import { SurveyAnswers } from '../types/survey';
import { SURVEY_QUESTIONS } from '../data/questions';
import { X, Copy, Check, FileText } from 'lucide-react';

interface OriginalAnswersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  answers: SurveyAnswers;
}

export const OriginalAnswersDrawer: React.FC<OriginalAnswersDrawerProps> = ({
  isOpen,
  onClose,
  answers,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const getAnswerForQuestion = (qId: number): string => {
    switch (qId) {
      case 1:
        return answers.area === 'Outra' && answers.areaOther
          ? `Outra: ${answers.areaOther}`
          : answers.area || 'Não informado';
      case 2:
        return answers.teamStructure || 'Não informado';
      case 3:
        return answers.processVolume ? `${answers.processVolume} processos/clientes` : 'Não informado';
      case 4:
        return answers.toolsUsed || 'Não informado';
      case 5:
        return answers.operationalControl || 'Não informado';
      case 6:
        return answers.mainDifficulties || 'Não informado';
      case 7:
        if (!answers.timeSinks || answers.timeSinks.length === 0) return 'Nenhuma selecionada';
        return (
          answers.timeSinks.join(', ') +
          (answers.timeSinksOther ? ` (Outro: ${answers.timeSinksOther})` : '')
        );
      case 8:
        return answers.desiredAutomation || 'Não informado';
      case 9:
        if (!answers.aiCapabilities || answers.aiCapabilities.length === 0) return 'Nenhuma selecionada';
        return (
          answers.aiCapabilities.join(', ') +
          (answers.aiCapabilitiesOther ? ` (Outra: ${answers.aiCapabilitiesOther})` : '')
        );
      case 10:
        return answers.idealDashboard || 'Não informado';
      case 11:
        return answers.singleTaskToEliminate || 'Não informado';
      default:
        return 'N/A';
    }
  };

  const handleCopyRaw = () => {
    const textToCopy = SURVEY_QUESTIONS.map((q) => {
      return `[${q.code}] ${q.title}\nResposta: ${getAnswerForQuestion(q.id)}\n`;
    }).join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#080808]/80 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#111113] border-l border-[#252529] h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[#252529] sticky top-0 bg-[#111113] z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00FF88]" />
            <h3 className="text-base font-semibold text-[#F5F5F5]">
              Respostas Originais Fornecidas
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRaw}
              className="px-2.5 py-1.5 rounded text-xs font-mono text-[#8A8A91] hover:text-[#F5F5F5] bg-[#161619] border border-[#252529] transition-all flex items-center gap-1.5"
              title="Copiar texto de todas as respostas"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00FF88]" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Tudo</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-[#8A8A91] hover:text-[#F5F5F5] hover:bg-[#161619] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-6 space-y-6 flex-1">
          {SURVEY_QUESTIONS.map((question) => {
            const answer = getAnswerForQuestion(question.id);
            return (
              <div
                key={question.id}
                className="p-4 rounded-xl bg-[#161619]/60 border border-[#252529]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-mono text-[#00FF88] px-1.5 py-0.5 rounded bg-[#00FF88]/10 border border-[#00FF88]/20">
                    {question.code}
                  </span>
                  <span className="text-xs font-mono text-[#8A8A91]">
                    {question.category}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-[#F5F5F5] mb-2 leading-relaxed">
                  {question.title}
                </h4>
                <div className="text-sm text-[#F5F5F5]/90 bg-[#111113] p-3 rounded-lg border border-[#252529]/80 font-mono whitespace-pre-wrap leading-relaxed">
                  {answer}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#252529] bg-[#111113] text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#252529] hover:bg-[#36363E] text-[#F5F5F5] text-xs font-mono font-medium transition-all"
          >
            Fechar e Voltar ao Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
