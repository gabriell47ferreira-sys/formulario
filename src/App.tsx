import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IntroScreen } from './components/IntroScreen';
import { Questionnaire } from './components/Questionnaire';
import { SubmissionSuccessScreen } from './components/SubmissionSuccessScreen';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SurveyAnswers } from './types/survey';
import { INITIAL_EMPTY_ANSWERS } from './data/mockData';
import { SURVEY_QUESTIONS } from './data/questions';
import { submitPublicSurvey, verifyAdminSession } from './services/api';
import {
  saveDraftAnswers,
  loadDraftAnswers,
  clearDraftAnswers,
} from './services/storage';

export const App: React.FC = () => {
  // Roteamento baseado no pathname
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Estados da Área Pública
  const [publicStep, setPublicStep] = useState<'intro' | 'survey' | 'success'>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswers>(INITIAL_EMPTY_ANSWERS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [hasSavedDraft, setHasSavedDraft] = useState(false);

  // Estados da Área Administrativa
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);

  // Listener para navegação por URL e histórico do navegador
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Checagem de rascunho local para o formulário público
  useEffect(() => {
    const draft = loadDraftAnswers();
    if (draft && draft.area) {
      setAnswers(draft);
      setHasSavedDraft(true);
    }
  }, []);

  // Checagem de autenticação da área admin
  useEffect(() => {
    if (currentPath.startsWith('/admin')) {
      verifyAdminSession().then((isValid) => {
        setIsAdminAuthenticated(isValid);
      });
    }
  }, [currentPath]);

  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // MÉTODOS DO FORMULÁRIO PÚBLICO DO ADVOGADO
  // -------------------------------------------------------------
  const handleAnswerChange = (updated: Partial<SurveyAnswers>) => {
    setAnswers((prev) => {
      const merged = { ...prev, ...updated };
      saveDraftAnswers(merged);
      setHasSavedDraft(true);
      return merged;
    });
  };

  const handleStartSurvey = () => {
    setPublicStep('survey');
    setCurrentQuestionIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResumeDraft = () => {
    setPublicStep('survey');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < SURVEY_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitSurvey = async () => {
    setIsSubmitting(true);
    try {
      // Envia as respostas para o backend
      // O backend registra e gera o relatório para a área do proprietário
      const res = await submitPublicSurvey(answers);
      setIsSubmitting(false);
      setSubmissionId(res.submissionId);
      clearDraftAnswers();
      setHasSavedDraft(false);
      setPublicStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setIsSubmitting(false);
      alert(err.message || 'Erro ao enviar respostas. Tente novamente.');
    }
  };

  const handleFinishSuccess = () => {
    setAnswers(INITIAL_EMPTY_ANSWERS);
    setSubmissionId('');
    setPublicStep('intro');
    setCurrentQuestionIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetPublic = () => {
    if (window.confirm('Deseja reiniciar suas respostas? O rascunho atual será limpo.')) {
      clearDraftAnswers();
      setAnswers(INITIAL_EMPTY_ANSWERS);
      setHasSavedDraft(false);
      setCurrentQuestionIndex(0);
      setPublicStep('intro');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // -------------------------------------------------------------
  // RENDERIZAÇÃO: ROTA ADMINISTRATIVA (/admin)
  // -------------------------------------------------------------
  if (currentPath.startsWith('/admin')) {
    if (isAdminAuthenticated === null) {
      return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center text-xs font-mono text-[#8A8A91]">
          Verificando permissões de acesso...
        </div>
      );
    }

    if (!isAdminAuthenticated) {
      return (
        <AdminLogin
          onSuccess={() => setIsAdminAuthenticated(true)}
          onBackToPublic={() => navigateTo('/')}
        />
      );
    }

    return (
      <AdminDashboard
        onLogout={() => setIsAdminAuthenticated(false)}
        onNavigateToPublic={() => navigateTo('/')}
      />
    );
  }

  // -------------------------------------------------------------
  // RENDERIZAÇÃO: ROTA PÚBLICA DO ADVOGADO (/)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#00FF88]/20 selection:text-[#00FF88]">
      <Header
        currentStep={publicStep}
        onReset={handleResetPublic}
      />

      <main className="flex-1 w-full">
        {publicStep === 'intro' && (
          <IntroScreen
            onStart={handleStartSurvey}
            hasSavedDraft={hasSavedDraft}
            onResumeDraft={handleResumeDraft}
          />
        )}

        {publicStep === 'survey' && (
          <Questionnaire
            answers={answers}
            currentIndex={currentQuestionIndex}
            isSubmitting={isSubmitting}
            onAnswerChange={handleAnswerChange}
            onNext={handleNextQuestion}
            onPrev={handlePrevQuestion}
            onSubmit={handleSubmitSurvey}
          />
        )}

        {publicStep === 'success' && (
          <SubmissionSuccessScreen
            submissionId={submissionId}
            onFinish={handleFinishSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default App;
