import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../../services/api';

interface AdminLoginProps {
  onSuccess: () => void;
  onBackToPublic?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToPublic }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await loginAdmin(username, password);
      setIsLoading(false);
      onSuccess();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Falha na autenticação. Verifique os dados.');
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111113] border border-[#252529] rounded-2xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
        {/* Brand / Tag */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#161619] border border-[#252529] flex items-center justify-center text-[#00FF88]">
            <Lock className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono uppercase bg-[#161619] text-[#8A8A91] border border-[#252529]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00FF88]" />
            Acesso Restrito
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5] mb-2">
          Painel do Proprietário
        </h2>
        <p className="text-xs sm:text-sm text-[#8A8A91] mb-6 leading-relaxed">
          Autenticação exclusiva para consulta de respostas e geração de relatórios de diagnóstico.
        </p>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-2.5 mb-5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[#8A8A91] uppercase tracking-wider mb-2">
              Usuário Administrativo
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-4 py-3 rounded-xl bg-[#161619] border border-[#252529] focus:border-[#00FF88] focus:outline-none text-[#F5F5F5] text-sm font-mono placeholder:text-[#5A5A62] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[#8A8A91] uppercase tracking-wider mb-2">
              Senha
            </label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#161619] border border-[#252529] focus:border-[#00FF88] focus:outline-none text-[#F5F5F5] text-sm font-mono placeholder:text-[#5A5A62] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-[#00FF88] hover:bg-[#00E57A] text-[#080808] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00FF88]/15 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Verificando credenciais...</span>
            ) : (
              <>
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#252529] text-center">
          {onBackToPublic && (
            <button
              onClick={onBackToPublic}
              className="text-xs text-[#8A8A91] hover:text-[#F5F5F5] transition-colors font-mono"
            >
              ← Ir para o Formulário Público
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
