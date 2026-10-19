import React from 'react';
import { TEST_PROFILES, TestProfile } from '../data/mockData';
import { X, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

interface TestProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: TestProfile) => void;
}

export const TestProfileModal: React.FC<TestProfileModalProps> = ({
  isOpen,
  onClose,
  onSelectProfile,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#080808]/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-[#111113] border border-[#252529] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#8A8A91] hover:text-[#F5F5F5] hover:bg-[#161619] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            AMBIENTE DE TESTE DE PRODUTO
          </span>
        </div>

        <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">
          Carregar Perfil de Teste Demonstrativo
        </h3>

        <p className="text-xs sm:text-sm text-[#8A8A91] mb-6 leading-relaxed">
          Selecione um cenário fictício pré-configurado para testar imediatamente o fluxo do formulário e inspecionar a geração das 8 seções do relatório.
        </p>

        <div className="space-y-3 mb-6">
          {TEST_PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => {
                onSelectProfile(profile);
                onClose();
              }}
              className="w-full p-4 rounded-xl text-left bg-[#161619] hover:bg-[#1D1D22] border border-[#252529] hover:border-[#00FF88]/40 transition-all group flex items-start justify-between gap-3 cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#00FF88]" />
                  <span className="text-sm font-semibold text-[#F5F5F5] group-hover:text-[#00FF88] transition-colors">
                    {profile.name}
                  </span>
                </div>
                <p className="text-xs text-[#8A8A91] leading-relaxed">
                  {profile.description}
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-[#5A5A62]">
                  <span>Área: {profile.answers.area}</span>
                  <span>·</span>
                  <span>Equipe: {profile.answers.teamStructure}</span>
                  <span>·</span>
                  <span>Volume: {profile.answers.processVolume}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#8A8A91] group-hover:text-[#00FF88] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-[#5A5A62] border-t border-[#252529] pt-4 text-center">
          Todos os dados carregados aqui serão explicitamente etiquetados como [DADOS DE TESTE].
        </div>
      </div>
    </div>
  );
};
