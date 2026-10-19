import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface SubmissionSuccessScreenProps {
  submissionId?: string;
  onFinish: () => void;
}

export const SubmissionSuccessScreen: React.FC<SubmissionSuccessScreenProps> = ({
  submissionId,
  onFinish,
}) => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center animate-fadeIn">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[#111113] border border-[#252529] flex items-center justify-center text-[#00FF88] shadow-2xl shadow-[#00FF88]/15 mb-8">
        <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
      </div>

      {/* Main Title Required by Prompt */}
      <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#F5F5F5] mb-4">
        Obrigado por contribuir.
      </h2>

      {/* Description Required by Prompt */}
      <p className="text-base sm:text-lg text-[#8A8A91] max-w-xl leading-relaxed mb-8">
        Suas respostas foram enviadas com sucesso e contribuirão para o desenvolvimento de uma ferramenta mais útil para a rotina jurídica.
      </p>

      {/* Protocol Badge (Neutral receipt acknowledgment) */}
      {submissionId && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#111113] border border-[#252529] text-xs font-mono text-[#8A8A91] mb-10">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00FF88]" />
          <span>Protocolo de envio: <strong className="text-[#F5F5F5]">{submissionId}</strong></span>
        </div>
      )}

      {/* Optional Button Required by Prompt: Finalizar pesquisa */}
      <div>
        <button
          onClick={onFinish}
          className="px-8 py-3 rounded-xl bg-[#161619] hover:bg-[#1D1D22] border border-[#252529] hover:border-[#36363E] text-sm font-semibold text-[#F5F5F5] transition-all cursor-pointer shadow-sm"
        >
          Finalizar pesquisa
        </button>
      </div>
    </div>
  );
};
