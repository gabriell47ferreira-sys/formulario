import React from 'react';
import { SURVEY_QUESTIONS } from '../data/questions';
import { SurveyAnswers } from '../types/survey';
import { QuestionCard } from './QuestionCard';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface QuestionnaireProps {
  answers: SurveyAnswers;
  currentIndex: number;
  isSubmitting?: boolean;
  onAnswerChange: (updated: Partial<SurveyAnswers>) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({
  answers,
  currentIndex,
  isSubmitting,
  onAnswerChange,
  onNext,
  onPrev,
  onSubmit,
}) => {
  const currentQuestion = SURVEY_QUESTIONS[currentIndex];
  const totalQuestions = SURVEY_QUESTIONS.length;
  const isFinalStep = currentIndex === totalQuestions - 1;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Validação suave para navegação
  const canProceed = () => {
    // Todas as perguntas permitem continuar (inclusive texto em branco ou não-respondido conforme regra 12: "Se uma pergunta não tiver resposta, indicar 'Não informado' e continuar")
    // Mas para perguntas de seleção única, se o usuário não selecionou ainda, permitimos pular ou avançar se desejar, ou apenas avançar diretamente.
    return true;
  };

  const handleNextClick = () => {
    if (isFinalStep) {
      onSubmit();
    } else {
      onNext();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12 flex flex-col min-h-[calc(100vh-4rem)] justify-between">
      {/* Top Header / Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono text-[#8A8A91] mb-3">
          <div className="flex items-center gap-2">
            {currentQuestion.isSpecialFinal ? (
              <span className="text-[#00FF88] font-semibold">Etapa de Encerramento</span>
            ) : (
              <span>
                Pergunta <strong className="text-[#F5F5F5]">{currentIndex + 1}</strong> de 10
              </span>
            )}
          </div>
          <span>{progressPercent}% concluído</span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-1 bg-[#161619] rounded-full overflow-hidden mb-8 border border-[#252529]/40">
          <div
            className="h-full bg-[#00FF88] transition-all duration-300 ease-out rounded-full shadow-[0_0_8px_rgba(0,255,136,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Content */}
        <div className="bg-[#111113] border border-[#252529] rounded-2xl p-6 sm:p-10 shadow-xl transition-all">
          <QuestionCard
            question={currentQuestion}
            answers={answers}
            onChange={onAnswerChange}
            onEnterPress={handleNextClick}
          />
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-8 pb-4 flex items-center justify-between border-t border-[#252529] mt-8">
        <button
          type="button"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-mono flex items-center gap-2 transition-all ${
            currentIndex === 0
              ? 'opacity-30 cursor-not-allowed text-[#5A5A62]'
              : 'text-[#8A8A91] hover:text-[#F5F5F5] hover:bg-[#161619] border border-[#252529]'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleNextClick}
            disabled={isSubmitting || !canProceed()}
            className={`px-6 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
              isFinalStep
                ? 'bg-[#00FF88] text-[#080808] hover:bg-[#00E57A] shadow-lg shadow-[#00FF88]/15'
                : 'bg-[#F5F5F5] text-[#080808] hover:bg-[#FFFFFF]'
            }`}
          >
            {isFinalStep ? (
              <>
                <span>{isSubmitting ? 'Enviando respostas...' : 'Concluir e Enviar Respostas'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Continuar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
