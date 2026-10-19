import React from 'react';
import { Terminal } from 'lucide-react';

interface HeaderProps {
  currentStep: 'intro' | 'survey' | 'success';
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentStep, onReset }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#252529] bg-[#080808]/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#111113] border border-[#252529] flex items-center justify-center text-[#00FF88] shadow-sm">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#F5F5F5] font-semibold">
                PESQUISA JURÍDICA
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20">
                ROTINA & PRODUTO
              </span>
            </div>
            <p className="text-[11px] text-[#8A8A91] hidden sm:block">
              Pesquisa Operacional com Escritórios de Advocacia
            </p>
          </div>
        </div>

        {/* Public actions */}
        <div className="flex items-center gap-3">
          {currentStep === 'survey' && onReset && (
            <button
              onClick={onReset}
              className="text-xs font-mono text-[#8A8A91] hover:text-[#F5F5F5] transition-colors"
            >
              Reiniciar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
