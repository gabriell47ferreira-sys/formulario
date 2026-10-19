import { ArrowRight, Clock, HelpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface IntroScreenProps {
  onStart: () => void;
  hasSavedDraft?: boolean;
  onResumeDraft?: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  onStart,
  hasSavedDraft,
  onResumeDraft,
}) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex flex-col items-center text-center">
      {/* Top Tag */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111113] border border-[#252529] mb-8">
        <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
        <span className="text-xs font-mono text-[#8A8A91] tracking-wider uppercase">
          Pesquisa de Rotina Jurídica · 2026
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F5F5F5] max-w-2xl leading-tight sm:leading-[1.15] mb-6">
        Entender a rotina jurídica. <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F5] via-[#8A8A91] to-[#00FF88]">
          Repensar o futuro.
        </span>
      </h1>

      {/* Description exactly as required */}
      <div className="text-base sm:text-lg text-[#8A8A91] max-w-2xl leading-relaxed space-y-4 mb-10 text-left sm:text-center">
        <p>
          Estamos desenvolvendo uma ferramenta voltada para advogados e queremos entender como funciona a rotina real de um escritório.
        </p>
        <p>
          Queremos descobrir o que toma tempo, gera dificuldades e poderia ser simplificado com tecnologia.
        </p>
        <p className="text-[#F5F5F5]/90 font-medium">
          Não é uma pesquisa comercial. Suas respostas ajudarão a orientar o desenvolvimento da ferramenta.
        </p>
      </div>

      {/* Meta indicators */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 text-xs font-mono text-[#8A8A91]">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111113] border border-[#252529]">
          <HelpCircle className="w-3.5 h-3.5 text-[#00FF88]" />
          <span>10 perguntas</span>
        </div>
        <span className="text-[#252529] hidden sm:inline">·</span>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#111113] border border-[#252529]">
          <Clock className="w-3.5 h-3.5 text-[#00FF88]" />
          <span>aproximadamente 3 minutos</span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-12">
        {hasSavedDraft && onResumeDraft ? (
          <>
            <button
              onClick={onResumeDraft}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00FF88] text-[#080808] font-semibold text-sm hover:bg-[#00E57A] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00FF88]/10 group cursor-pointer"
            >
              <span>Continuar de onde parou</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#111113] text-[#8A8A91] hover:text-[#F5F5F5] font-medium text-sm border border-[#252529] hover:border-[#36363E] transition-all cursor-pointer"
            >
              Começar do início
            </button>
          </>
        ) : (
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00FF88] text-[#080808] font-semibold text-sm hover:bg-[#00E57A] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00FF88]/10 group cursor-pointer"
          >
            <span>Começar pesquisa</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </div>

      {/* Trust micro-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl text-left border-t border-[#252529] pt-8">
        <div className="p-4 rounded-xl bg-[#111113]/50 border border-[#252529]/60">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-[#F5F5F5]">
            <ShieldCheck className="w-4 h-4 text-[#00FF88]" />
            <span>Confidencialidade</span>
          </div>
          <p className="text-xs text-[#8A8A91] leading-relaxed">
            Nenhum dado pessoal sensível ou informações sigilosas de clientes são solicitadas.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#111113]/50 border border-[#252529]/60">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-mono text-[#F5F5F5]">
            <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
            <span>Objetivo Real</span>
          </div>
          <p className="text-xs text-[#8A8A91] leading-relaxed">
            Descobrir atritos reais da rotina jurídica para orientar decisões de produto de tecnologia.
          </p>
        </div>
      </div>
    </div>
  );
};
