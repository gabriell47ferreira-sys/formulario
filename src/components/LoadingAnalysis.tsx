import React, { useEffect, useState } from 'react';
import { Terminal, Shield, CheckCircle2 } from 'lucide-react';

interface LoadingAnalysisProps {
  onComplete: () => void;
}

const ANALYSIS_STEPS = [
  'Isolando evidências e relatos explícitos fornecidos...',
  'Mapeando matriz de ferramentas, prazos e controle de rotina...',
  'Examinando tarefas candidatas à automação e impacto operacional...',
  'Avaliando modelos de IA solicitados com salvaguardas de supervisão humana...',
  'Calculando prioridades de MVP e síntese das 8 seções estratégicas...',
];

export const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 15;
      });
    }, 250);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#111113] border border-[#252529] flex items-center justify-center text-[#00FF88] shadow-2xl shadow-[#00FF88]/10 mb-8 relative">
        <Terminal className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FF88] rounded-full animate-ping" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111113] border border-[#252529] mb-4 text-xs font-mono text-[#8A8A91]">
        <Shield className="w-3.5 h-3.5 text-[#00FF88]" />
        <span>MOTOR DE DIAGNÓSTICO JURÍDICO</span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5] mb-2">
        Processando respostas operacionais
      </h2>

      <p className="text-sm text-[#8A8A91] mb-8 font-mono h-6 transition-all">
        {ANALYSIS_STEPS[currentStepIndex]}
      </p>

      {/* Progress track */}
      <div className="w-full max-w-md h-1.5 bg-[#111113] border border-[#252529] rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-[#00FF88] transition-all duration-300 ease-out shadow-[0_0_12px_rgba(0,255,136,0.8)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Verification indicators */}
      <div className="space-y-2 text-left w-full max-w-sm text-xs font-mono text-[#8A8A91]">
        {ANALYSIS_STEPS.map((step, idx) => (
          <div
            key={step}
            className={`flex items-center gap-2 transition-all ${
              idx <= currentStepIndex ? 'text-[#F5F5F5]' : 'text-[#36363E]'
            }`}
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                idx <= currentStepIndex ? 'text-[#00FF88]' : 'text-[#252529]'
              }`}
            />
            <span className="truncate">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
