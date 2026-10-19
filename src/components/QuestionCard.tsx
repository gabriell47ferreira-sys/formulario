import React from 'react';
import { QuestionDefinition } from '../data/questions';
import { SurveyAnswers, LawArea, TeamStructure, ProcessVolume, TimeSinkOption, AIDesiredOption } from '../types/survey';
import { Check, Sparkles } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionDefinition;
  answers: SurveyAnswers;
  onChange: (updated: Partial<SurveyAnswers>) => void;
  onEnterPress?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answers,
  onChange,
  onEnterPress,
}) => {
  // Manejo de tecla Enter no textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && onEnterPress) {
      e.preventDefault();
      onEnterPress();
    }
  };

  // Renderizador para Seleção Única
  const renderSingleSelect = () => {
    let currentValue = '';
    let otherValue = '';

    if (question.id === 1) {
      currentValue = answers.area;
      otherValue = answers.areaOther || '';
    } else if (question.id === 2) {
      currentValue = answers.teamStructure;
    } else if (question.id === 3) {
      currentValue = answers.processVolume;
    }

    const handleSelect = (option: string) => {
      if (question.id === 1) {
        onChange({ area: option as LawArea });
      } else if (question.id === 2) {
        onChange({ teamStructure: option as TeamStructure });
      } else if (question.id === 3) {
        onChange({ processVolume: option as ProcessVolume });
      }
    };

    const handleOtherTextChange = (text: string) => {
      if (question.id === 1) {
        onChange({ areaOther: text });
      }
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options?.map((option) => {
            const isSelected = currentValue === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full p-4 rounded-xl text-left font-medium transition-all flex items-center justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-[#111113] border-[#00FF88] text-[#F5F5F5] shadow-sm shadow-[#00FF88]/10'
                    : 'bg-[#111113]/60 border-[#252529] text-[#8A8A91] hover:text-[#F5F5F5] hover:bg-[#161619] hover:border-[#36363E]'
                }`}
              >
                <span className="text-sm sm:text-base">{option}</span>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-[#00FF88] bg-[#00FF88] text-[#080808]'
                      : 'border-[#36363E] bg-transparent'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Campo complementar se selecionou "Outra" */}
        {question.allowOther && currentValue === 'Outra' && (
          <div className="mt-4 pt-3 border-t border-[#252529] animate-fadeIn">
            <label className="block text-xs font-mono text-[#8A8A91] uppercase tracking-wider mb-2">
              Especifique sua área de atuação:
            </label>
            <input
              type="text"
              autoFocus
              value={otherValue}
              onChange={(e) => handleOtherTextChange(e.target.value)}
              placeholder={question.otherPlaceholder || 'Digite aqui...'}
              className="w-full px-4 py-3 rounded-xl bg-[#161619] border border-[#252529] focus:border-[#00FF88] focus:outline-none text-[#F5F5F5] text-sm placeholder:text-[#5A5A62] transition-colors"
            />
          </div>
        )}
      </div>
    );
  };

  // Renderizador para Múltipla Seleção
  const renderMultiSelect = () => {
    let selectedList: string[] = [];
    let otherText = '';

    if (question.id === 7) {
      selectedList = answers.timeSinks || [];
      otherText = answers.timeSinksOther || '';
    } else if (question.id === 9) {
      selectedList = answers.aiCapabilities || [];
      otherText = answers.aiCapabilitiesOther || '';
    }

    const toggleOption = (option: string) => {
      let updated: string[];
      if (selectedList.includes(option)) {
        updated = selectedList.filter((item) => item !== option);
      } else {
        updated = [...selectedList, option];
      }

      if (question.id === 7) {
        onChange({ timeSinks: updated as TimeSinkOption[] });
      } else if (question.id === 9) {
        onChange({ aiCapabilities: updated as AIDesiredOption[] });
      }
    };

    const handleOtherTextChange = (text: string) => {
      if (question.id === 7) {
        onChange({ timeSinksOther: text });
      } else if (question.id === 9) {
        onChange({ aiCapabilitiesOther: text });
      }
    };

    const isOtherSelected = selectedList.includes('Outro') || selectedList.includes('Outra');

    return (
      <div className="space-y-3">
        <p className="text-xs font-mono text-[#8A8A91] mb-2">
          (Pode marcar mais de uma opção)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options?.map((option) => {
            const isChecked = selectedList.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className={`w-full p-3.5 sm:p-4 rounded-xl text-left font-medium transition-all flex items-center justify-between border cursor-pointer ${
                  isChecked
                    ? 'bg-[#111113] border-[#00FF88] text-[#F5F5F5] shadow-sm shadow-[#00FF88]/10'
                    : 'bg-[#111113]/60 border-[#252529] text-[#8A8A91] hover:text-[#F5F5F5] hover:bg-[#161619] hover:border-[#36363E]'
                }`}
              >
                <span className="text-sm">{option}</span>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    isChecked
                      ? 'border-[#00FF88] bg-[#00FF88] text-[#080808]'
                      : 'border-[#36363E] bg-transparent'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Campo complementar se selecionou Outro/Outra */}
        {question.allowOther && isOtherSelected && (
          <div className="mt-4 pt-3 border-t border-[#252529] animate-fadeIn">
            <label className="block text-xs font-mono text-[#8A8A91] uppercase tracking-wider mb-2">
              Detalhar opção personalizada:
            </label>
            <input
              type="text"
              autoFocus
              value={otherText}
              onChange={(e) => handleOtherTextChange(e.target.value)}
              placeholder={question.otherPlaceholder || 'Digite aqui...'}
              className="w-full px-4 py-3 rounded-xl bg-[#161619] border border-[#252529] focus:border-[#00FF88] focus:outline-none text-[#F5F5F5] text-sm placeholder:text-[#5A5A62] transition-colors"
            />
          </div>
        )}
      </div>
    );
  };

  // Renderizador para Texto Aberto
  const renderTextOpen = () => {
    let value = '';
    if (question.id === 4) value = answers.toolsUsed;
    else if (question.id === 5) value = answers.operationalControl;
    else if (question.id === 6) value = answers.mainDifficulties;
    else if (question.id === 8) value = answers.desiredAutomation;
    else if (question.id === 10) value = answers.idealDashboard;
    else if (question.id === 11) value = answers.singleTaskToEliminate;

    const handleChange = (newVal: string) => {
      if (question.id === 4) onChange({ toolsUsed: newVal });
      else if (question.id === 5) onChange({ operationalControl: newVal });
      else if (question.id === 6) onChange({ mainDifficulties: newVal });
      else if (question.id === 8) onChange({ desiredAutomation: newVal });
      else if (question.id === 10) onChange({ idealDashboard: newVal });
      else if (question.id === 11) onChange({ singleTaskToEliminate: newVal });
    };

    return (
      <div className="space-y-2">
        <textarea
          autoFocus
          rows={question.isSpecialFinal ? 4 : 4}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={question.placeholder}
          className={`w-full p-4 rounded-xl bg-[#111113] border text-[#F5F5F5] text-sm sm:text-base placeholder:text-[#5A5A62] focus:outline-none transition-all resize-none leading-relaxed ${
            question.isSpecialFinal
              ? 'border-[#00FF88]/40 focus:border-[#00FF88] shadow-sm shadow-[#00FF88]/5'
              : 'border-[#252529] focus:border-[#00FF88]'
          }`}
        />
        <div className="flex items-center justify-between text-xs font-mono text-[#5A5A62] px-1">
          <span>Pressione Ctrl + Enter para avançar rápido</span>
          <span>{value.length} caracteres</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Category / Code Badge */}
      <div className="flex items-center gap-2 mb-4">
        {question.isSpecialFinal ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            ETAPA ESPECIAL DE ENCERRAMENTO
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-[#161619] text-[#8A8A91] border border-[#252529]">
            {question.code} · {question.category}
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-[#F5F5F5] mb-3 leading-snug">
        {question.title}
      </h2>

      {/* Subtitle / context */}
      {question.subtitle && (
        <p className="text-sm sm:text-base text-[#8A8A91] mb-8 leading-relaxed">
          {question.subtitle}
        </p>
      )}

      {/* Input container */}
      <div className="mt-2">
        {question.type === 'single-select' && renderSingleSelect()}
        {question.type === 'multi-select' && renderMultiSelect()}
        {question.type === 'text-open' && renderTextOpen()}
      </div>
    </div>
  );
};
