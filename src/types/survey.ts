export type LawArea =
  | 'Previdenciário'
  | 'Trabalhista'
  | 'Cível'
  | 'Família e Sucessões'
  | 'Empresarial'
  | 'Criminal'
  | 'Tributário'
  | 'Outra';

export type TeamStructure =
  | 'Sozinho'
  | '2–3 pessoas'
  | '4–10 pessoas'
  | '10+ pessoas';

export type ProcessVolume =
  | 'Até 20'
  | '20–50'
  | '50–100'
  | '100–300'
  | 'Mais de 300';

export type TimeSinkOption =
  | 'Prazos'
  | 'Documentos'
  | 'Atendimento / WhatsApp'
  | 'Acompanhamento de processos'
  | 'Elaborar documentos / peças'
  | 'Cadastro de informações'
  | 'Financeiro / cobranças'
  | 'Organização da equipe'
  | 'Outro';

export type AIDesiredOption =
  | 'Resumir processos / documentos'
  | 'Organizar documentos'
  | 'Encontrar informações'
  | 'Criar rascunhos'
  | 'Identificar prazos e tarefas'
  | 'Preparar respostas para clientes'
  | 'Outra';

export interface SurveyAnswers {
  // Q1
  area: LawArea | '';
  areaOther?: string;
  // Q2
  teamStructure: TeamStructure | '';
  // Q3
  processVolume: ProcessVolume | '';
  // Q4
  toolsUsed: string;
  // Q5
  operationalControl: string;
  // Q6
  mainDifficulties: string;
  // Q7
  timeSinks: TimeSinkOption[];
  timeSinksOther?: string;
  // Q8
  desiredAutomation: string;
  // Q9
  aiCapabilities: AIDesiredOption[];
  aiCapabilitiesOther?: string;
  // Q10
  idealDashboard: string;
  // Pergunta final complementar
  singleTaskToEliminate: string;
  // Metadata
  isTestData?: boolean;
  testProfileName?: string;
  completedAt?: string;
}

export type EvidenceType = 'Relatado' | 'Hipótese' | 'Recomendação';

export interface DifficultyItem {
  problemReported: string; // O que o advogado efetivamente informou
  potentialImpact: string; // Consequência possível fundamentada
  evidenceGrade: 'Relato explícito' | 'Interpretação a confirmar';
}

export interface ImprovementOpportunity {
  relatedProblem: string;
  suggestedSolution: string;
  expectedBenefit: string;
  feasibility: 'Baixa' | 'Média' | 'Alta';
  justifyingEvidence: string;
}

export interface AIOpportunity {
  identifiedNeed: string;
  suggestedAIApplication: string;
  expectedBenefit: string;
  limitationsAndCare: string;
  humanSupervisionRequirement: string;
  sourceType: 'Solicitado pelo advogado' | 'Sugerido pela análise';
}

export interface DashboardItem {
  name: string;
  description: string;
  priority: 'Alta' | 'Média' | 'Normal';
  source: 'Solicitado explicitamente' | 'Recomendado pela análise';
}

export interface MVPFeature {
  name: string;
  problemSolved: string;
  evidence: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  complexity: 'Baixa' | 'Média' | 'Alta';
}

export interface StrategicReport {
  id: string;
  generatedAt: string;
  isTestData: boolean;
  testProfileName?: string;

  // Resumo Executivo
  executiveSummary: {
    officeProfile: string;
    coreOperationalNeed: string;
    mainImprovementOpportunity: string;
    mostPromisingAIOpportunity: string;
    recommendedFirstStep: string;
    unvalidatedPoints: string[];
  };

  // Seção 1 — Perfil Profissional
  section1_Profile: {
    mainArea: string;
    teamSize: string;
    volume: string;
    profileSummary: string;
  };

  // Seção 2 — Estrutura de Trabalho Atual
  section2_WorkStructure: {
    reportedTools: string[];
    reportedMethods: string[];
    explicitData: string[];
    cautiousInterpretations: string[];
    summary: string;
  };

  // Seção 3 — Principais Dificuldades
  section3_Difficulties: {
    items: DifficultyItem[];
    timeSinksReported: string[];
    synthesis: string;
  };

  // Seção 4 — Oportunidades de Melhoria
  section4_Improvements: {
    items: ImprovementOpportunity[];
    synthesis: string;
  };

  // Seção 5 — Oportunidades de Inteligência Artificial
  section5_AIOpportunities: {
    items: AIOpportunity[];
    governanceDisclaimer: string;
  };

  // Seção 6 — Dashboard Ideal
  section6_IdealDashboard: {
    explicitRequests: string[];
    recommendedWidgets: DashboardItem[];
    summary: string;
  };

  // Seção 7 — Recomendações para o Desenvolvimento do SaaS
  section7_SaaSRecommendations: {
    mvpFeatures: MVPFeature[];
    futureEvolutions: string[];
    simplificationGuidelines: string[];
    mvpProposalSummary: string;
  };

  // Seção 8 — Conclusão
  section8_Conclusion: {
    officeContext: string;
    primaryFocalPoint: string;
    immediateNextStep: string;
    validationChecklist: string[];
    finalStatement: string;
  };
}
