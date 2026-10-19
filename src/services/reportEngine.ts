import {
  SurveyAnswers,
  StrategicReport,
  DifficultyItem,
  ImprovementOpportunity,
  AIOpportunity,
  DashboardItem,
  MVPFeature,
} from '../types/survey';

/**
 * Motor Analítico Determinístico e Estratégico
 * 
 * Regras Obrigatórias Implementadas:
 * 1. Baseia-se exclusivamente nas respostas do profissional.
 * 2. Diferencia 'Relatado' (Fato), 'Hipótese' e 'Recomendação'.
 * 3. Se uma pergunta não foi preenchida, declara "Não informado" sem suposições.
 * 4. Evita projeções financeiras ou de produtividade sem dados que as sustentem.
 * 5. Destaca a necessidade inegociável de supervisão humana em soluções de IA.
 */

export function generateStrategicReport(answers: SurveyAnswers): StrategicReport {
  const generatedAt = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const id = `REP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Normalização de campos com tolerância a não-preenchimento
  const areaReported = answers.area
    ? (answers.area === 'Outra' && answers.areaOther ? `Outra (${answers.areaOther.trim()})` : answers.area)
    : 'Não informado';

  const teamReported = answers.teamStructure || 'Não informado';
  const volumeReported = answers.processVolume ? `${answers.processVolume} clientes/processos` : 'Não informado';

  const toolsReportedRaw = answers.toolsUsed.trim();
  const operationalControlRaw = answers.operationalControl.trim();
  const mainDifficultiesRaw = answers.mainDifficulties.trim();
  const desiredAutomationRaw = answers.desiredAutomation.trim();
  const idealDashboardRaw = answers.idealDashboard.trim();
  const singleTaskToEliminateRaw = answers.singleTaskToEliminate.trim();

  // -------------------------------------------------------------
  // SEÇÃO 1: PERFIL PROFISSIONAL
  // -------------------------------------------------------------
  const section1_Profile = {
    mainArea: areaReported,
    teamSize: teamReported,
    volume: volumeReported,
    profileSummary: `Atuação concentrada na área de ${areaReported}, operando com estrutura de ${teamReported.toLowerCase()} e carteira ativa na faixa de ${volumeReported.toLowerCase()}. Os dados refletem estritamente as faixas e categorias indicadas no questionário.`,
  };

  // -------------------------------------------------------------
  // SEÇÃO 2: ESTRUTURA DE TRABALHO ATUAL
  // -------------------------------------------------------------
  const reportedTools: string[] = [];
  if (toolsReportedRaw) {
    reportedTools.push(toolsReportedRaw);
  } else {
    reportedTools.push('Nenhuma ferramenta específica informada');
  }

  const reportedMethods: string[] = [];
  if (operationalControlRaw) {
    reportedMethods.push(operationalControlRaw);
  } else {
    reportedMethods.push('Método de controle operacional não informado');
  }

  const explicitData: string[] = [
    `Ferramentas em uso: ${toolsReportedRaw || 'Não informado'}`,
    `Método de gestão de prazos e tarefas: ${operationalControlRaw || 'Não informado'}`,
  ];

  const cautiousInterpretations: string[] = [];
  const lowerTools = toolsReportedRaw.toLowerCase();
  const lowerControl = operationalControlRaw.toLowerCase();

  const hasSpreadsheet = lowerTools.includes('planilh') || lowerControl.includes('planilh') || lowerTools.includes('excel');
  const hasWhatsapp = lowerTools.includes('whatsapp') || lowerControl.includes('whatsapp') || lowerTools.includes('zap');
  const hasDedicatedSoftware = lowerTools.includes('sistema') || lowerTools.includes('software') || lowerTools.includes('astrea') || lowerTools.includes('projuris') || lowerTools.includes('advbox') || lowerTools.includes('saj');
  const hasPhysicalNotes = lowerControl.includes('caderno') || lowerControl.includes('papel') || lowerControl.includes('anotaç') || lowerControl.includes('físic');

  if (hasSpreadsheet && hasWhatsapp && !hasDedicatedSoftware) {
    cautiousInterpretations.push(
      'Estrutura com forte dependência de canais de mensageria instantânea e planilhas descentralizadas, configurando um ecossistema ágil, porém sujeito a dispersão de histórico.'
    );
  } else if (hasDedicatedSoftware) {
    cautiousInterpretations.push(
      'Uso relatado de software ou sistema jurídico; contudo, a coexistência com outras ferramentas manuais ou mensageria sugere possíveis lacunas de adesão ou atrito na rotina completa.'
    );
  } else if (hasPhysicalNotes) {
    cautiousInterpretations.push(
      'Presença de anotações físicas ou rotinas manuais de registro. Isso demonstra apego a controles visuais imediatos, mas representa um ponto de fragilidade para sincronização em equipe ou buscas rápidas.'
    );
  } else {
    cautiousInterpretations.push(
      'A rotina informada apoia-se em fluxos que necessitam de consolidação para evitar retrabalho operacional.'
    );
  }

  const section2_WorkStructure = {
    reportedTools,
    reportedMethods,
    explicitData,
    cautiousInterpretations,
    summary: `O escritório gerencia sua rotina por meio de: "${toolsReportedRaw || 'ferramentas não detalhadas'}", efetuando o controle de prazos e tarefas via: "${operationalControlRaw || 'rotina não detalhada'}".`,
  };

  // -------------------------------------------------------------
  // SEÇÃO 3: PRINCIPAIS DIFICULDADES
  // -------------------------------------------------------------
  const difficultyItems: DifficultyItem[] = [];

  if (mainDifficultiesRaw) {
    difficultyItems.push({
      problemReported: mainDifficultiesRaw,
      potentialImpact: 'Possível atrito na alocação de tempo cognitivo e risco de sobrecarga em momentos de pico operacional.',
      evidenceGrade: 'Relato explícito',
    });
  } else {
    difficultyItems.push({
      problemReported: 'Dificuldade principal não detalhada no formulário.',
      potentialImpact: 'Não é possível mensurar impactos sem relato do profissional.',
      evidenceGrade: 'Interpretação a confirmar',
    });
  }

  // Dificuldade decorrente da tarefa que gostaria de eliminar
  if (singleTaskToEliminateRaw) {
    difficultyItems.push({
      problemReported: `Tarefa desgastante declarada para eliminação: "${singleTaskToEliminateRaw}".`,
      potentialImpact: 'Drenagem contínua de foco que poderia ser direcionado à estratégia jurídica ou captação de clientes.',
      evidenceGrade: 'Relato explícito',
    });
  }

  // Dificuldades a partir do consumo de tempo
  const selectedTimeSinks = answers.timeSinks || [];
  if (selectedTimeSinks.length > 0) {
    const timeSinkSummary = selectedTimeSinks.join(', ') + (answers.timeSinksOther ? ` (Outro: ${answers.timeSinksOther})` : '');
    difficultyItems.push({
      problemReported: `Atividades com maior consumo de tempo relatadas: ${timeSinkSummary}.`,
      potentialImpact: 'Fragmentação da jornada diária entre múltiplos polos operacionais.',
      evidenceGrade: 'Relato explícito',
    });
  }

  const section3_Difficulties = {
    items: difficultyItems,
    timeSinksReported: selectedTimeSinks,
    synthesis: selectedTimeSinks.length > 0
      ? `As principais fontes de consumo de tempo concentram-se em: ${selectedTimeSinks.join(', ')}.`
      : 'Nenhuma fonte específica de consumo de tempo foi selecionada.',
  };

  // -------------------------------------------------------------
  // SEÇÃO 4: OPORTUNIDADES DE MELHORIA
  // -------------------------------------------------------------
  const improvementItems: ImprovementOpportunity[] = [];

  // Oportunidade 1: Atendimento / WhatsApp
  if (selectedTimeSinks.includes('Atendimento / WhatsApp') || lowerDifficultiesOrAutomation('whatsapp', answers) || lowerDifficultiesOrAutomation('atendimento', answers)) {
    improvementItems.push({
      relatedProblem: 'Atendimento contínuo e consultas repetitivas de status por clientes via canais imediatos.',
      suggestedSolution: 'Centralização de histórico de conversas e painel de status pré-formatado para consulta rápida ou atualização unificada.',
      expectedBenefit: 'Redução substancial de interrupções diárias sem prejuízo à qualidade de resposta ao cliente.',
      feasibility: 'Alta',
      justifyingEvidence: 'Advogado indicou "Atendimento / WhatsApp" entre as atividades mais consumidoras de tempo ou no relato de dificuldades.',
    });
  }

  // Oportunidade 2: Prazos e Intimações
  if (selectedTimeSinks.includes('Prazos') || selectedTimeSinks.includes('Acompanhamento de processos') || lowerDifficultiesOrAutomation('prazo', answers)) {
    improvementItems.push({
      relatedProblem: 'Vigilância contínua sobre vencimentos e publicação de notas de expediente.',
      suggestedSolution: 'Mecanismo simplificado de fila de prazos com ordenação visual por criticidade temporal e confirmação explícita.',
      expectedBenefit: 'Mitigação da ansiedade de monitoramento e eliminação de verificações manuais redundantes.',
      feasibility: 'Alta',
      justifyingEvidence: 'Advogado citou controle de prazos ou acompanhamento processual como ponto crítico em suas respostas.',
    });
  }

  // Oportunidade 3: Gestão de Documentos / Peças
  if (selectedTimeSinks.includes('Documentos') || selectedTimeSinks.includes('Elaborar documentos / peças') || lowerDifficultiesOrAutomation('document', answers)) {
    improvementItems.push({
      relatedProblem: 'Dispersão de arquivos comprobatórios e esforço recorrente na elaboração/organização de minutas.',
      suggestedSolution: 'Padronização de repositório indexado por cliente/processo com templates estruturados e busca rápida.',
      expectedBenefit: 'Diminuição do tempo gasto localizando documentos e aceleração da montagem inicial de peças.',
      feasibility: 'Média',
      justifyingEvidence: 'Assinalado consumo de tempo com documentos/peças e/ou relato de arquivos descentralizados.',
    });
  }

  // Oportunidade 4: Equipe / Delegação (se equipe > 1)
  if (answers.teamStructure && answers.teamStructure !== 'Sozinho') {
    improvementItems.push({
      relatedProblem: 'Alinhamento operacional e acompanhamento de tarefas entre membros da equipe.',
      suggestedSolution: 'Quadro simples de atribuição com responsável único por ato processual e visualização de gargalos.',
      expectedBenefit: 'Clareza imediata sobre quem está executando cada prazo sem necessidade de reuniões ou mensagens de cobrança.',
      feasibility: 'Alta',
      justifyingEvidence: `Estrutura com equipe declarada de "${answers.teamStructure}".`,
    });
  }

  // Se poucas oportunidades específicas, adicionar a oportunidade baseada na automação desejada
  if (desiredAutomationRaw) {
    improvementItems.push({
      relatedProblem: `Demanda de automação indicada: "${desiredAutomationRaw}".`,
      suggestedSolution: `Modelagem de um fluxo direto e sem atrito para: ${desiredAutomationRaw}.`,
      expectedBenefit: 'Atendimento pontual à principal prioridade subjetiva manifestada pelo profissional.',
      feasibility: 'Média',
      justifyingEvidence: `Resposta fornecida à Pergunta 08 ("Qual tarefa você mais gostaria de automatizar?").`,
    });
  }

  const section4_Improvements = {
    items: improvementItems,
    synthesis: `Foram mapeadas ${improvementItems.length} frentes concretas de melhoria, derivadas exclusivamente das atividades e queixas informadas.`,
  };

  // -------------------------------------------------------------
  // SEÇÃO 5: OPORTUNIDADES DE INTELIGÊNCIA ARTIFICIAL
  // -------------------------------------------------------------
  const aiItems: AIOpportunity[] = [];
  const selectedAICapabilities = answers.aiCapabilities || [];

  // Mapeamento baseado nas opções selecionadas em Q09
  if (selectedAICapabilities.includes('Resumir processos / documentos')) {
    aiItems.push({
      identifiedNeed: 'Extração rápida de teses, decisões e linha do tempo de autos volumosos.',
      suggestedAIApplication: 'Resumos executivos de peças e decisões judiciais estruturados em pontos fáticos e dispositivos.',
      expectedBenefit: 'Aceleração da compreensão de novos processos recebidos ou recursos adversos.',
      limitationsAndCare: 'A IA pode omitir nuances probatórias sutis ou interpretações divergentes de jurisprudência.',
      humanSupervisionRequirement: 'O advogado deve obrigatoriamente validar o resumo contra as peças originais dos autos antes de fundamentar qualquer manifestação.',
      sourceType: 'Solicitado pelo advogado',
    });
  }

  if (selectedAICapabilities.includes('Organizar documentos')) {
    aiItems.push({
      identifiedNeed: 'Triagem e rotulação automática de comprovantes, petições e anexos desorganizados.',
      suggestedAIApplication: 'Classificação semântica de documentos PDF por tipo (procuração, comprovante de residência, laudo, sentença) com renomeação padronizada.',
      expectedBenefit: 'Redução drástica do trabalho braçal de renomear e arquivar documentos em pastas.',
      limitationsAndCare: 'Documentos ilegíveis, digitalizados em baixa resolução ou manuscritos podem ser classificados incorretamente.',
      humanSupervisionRequirement: 'Conferência visual da classificação antes da juntada nos sistemas judiciais.',
      sourceType: 'Solicitado pelo advogado',
    });
  }

  if (selectedAICapabilities.includes('Identificar prazos e tarefas')) {
    aiItems.push({
      identifiedNeed: 'Detecção de prazos processuais a partir do texto de intimações e despachos.',
      suggestedAIApplication: 'Extração assistida de datas de intimação e sugestão de cálculo de prazo com base no CPC/CLT/CPP.',
      expectedBenefit: 'Apoio na identificação imediata de providências exigidas pelo juízo.',
      limitationsAndCare: 'Feriados locais, suspensões de expediente de tribunais específicos e contagens especiais não devem ser deduzidos de forma cega pela IA.',
      humanSupervisionRequirement: 'Aprovação e fixação do prazo pelo advogado responsável com dupla verificação contra a publicação oficial.',
      sourceType: 'Solicitado pelo advogado',
    });
  }

  if (selectedAICapabilities.includes('Criar rascunhos')) {
    aiItems.push({
      identifiedNeed: 'Redação inicial de petições simples, notificações ou manifestações preliminares.',
      suggestedAIApplication: 'Geração de primeiro rascunho fundamentado em fatos inseridos pelo profissional e teses do escritório.',
      expectedBenefit: 'Superação da "página em branco" e redução do tempo inicial de confecção da peça.',
      limitationsAndCare: 'Risco de "alucinações" jurisprudenciais ou citações inexistentes se o modelo for genérico.',
      humanSupervisionRequirement: 'Revisão jurídica integral, checagem das citações de artigos e verificação da adequação técnica.',
      sourceType: 'Solicitado pelo advogado',
    });
  }

  if (selectedAICapabilities.includes('Preparar respostas para clientes')) {
    aiItems.push({
      identifiedNeed: 'Comunicação compreensível e rápida sobre o andamento do processo ao cliente leigo.',
      suggestedAIApplication: 'Tradução do jargão jurídico de despachos em mensagens claras e corteses para envio via WhatsApp/e-mail.',
      expectedBenefit: 'Atendimento humanizado sem exigir que o advogado redija manualmente explicações rotineiras.',
      limitationsAndCare: 'Possibilidade de gerar falsas expectativas ou promessas de resultado se a mensagem for ambígua.',
      humanSupervisionRequirement: 'O profissional ou assistente deve ler e autorizar expressamente o envio da mensagem gerada.',
      sourceType: 'Solicitado pelo advogado',
    });
  }

  if (selectedAICapabilities.includes('Encontrar informações')) {
    aiItems.push({
      identifiedNeed: 'Busca inteligente em documentos internos, teses anteriores e acervo do escritório.',
      suggestedAIApplication: 'Busca semântica em linguagem natural dentro da base de conhecimento do escritório.',
      expectedBenefit: 'Localização instantânea de argumentos prévios sem depender da lembrança de nomes de arquivos.',
      limitationsAndCare: 'A abrangência depende diretamente da qualidade e integridade do acervo indexado.',
      humanSupervisionRequirement: 'Avaliação da atualidade jurídica da tese encontrada frente à legislação vigente.',
      sourceType: 'Solicitado pelo advogado',
    });
  }

  // Se nenhuma opção foi selecionada em Q09, sugerir cautelosamente com base nas dificuldades
  if (aiItems.length === 0) {
    aiItems.push({
      identifiedNeed: 'Organização de rotina e priorização de atividades diárias.',
      suggestedAIApplication: 'Assistente de triagem de demandas e sugestão de prioridades com base nas tarefas cadastradas.',
      expectedBenefit: 'Apoio na clareza mental do início da jornada.',
      limitationsAndCare: 'Depende de inputs fidedignos de tarefas fornecidos pelo usuário.',
      humanSupervisionRequirement: 'Decisão final sobre prioridades sempre cabe ao profissional.',
      sourceType: 'Sugerido pela análise',
    });
  }

  const section5_AIOpportunities = {
    items: aiItems,
    governanceDisclaimer:
      'Princípio de Governança: A inteligência artificial opera estritamente como mecanismo de apoio e aceleração. Nenhuma peça, prazo, mensagem ou orientação jurídica deve ser disparada sem revisão, aprovação e responsabilidade técnica de um advogado.',
  };

  // -------------------------------------------------------------
  // SEÇÃO 6: DASHBOARD IDEAL
  // -------------------------------------------------------------
  const explicitDashboardRequests: string[] = [];
  const recommendedWidgets: DashboardItem[] = [];

  if (idealDashboardRaw) {
    explicitDashboardRequests.push(idealDashboardRaw);
  } else {
    explicitDashboardRequests.push('Nenhuma preferência explícita foi indicada na Pergunta 10.');
  }

  // Extrair widgets a partir da Q10
  const lowerDash = idealDashboardRaw.toLowerCase();
  
  // Widget de Prazos do Dia
  const requestedPrazos = lowerDash.includes('prazo') || lowerDash.includes('urgên') || lowerDash.includes('venc');
  recommendedWidgets.push({
    name: 'Fila de Prazos Críticos (Hoje & Próximos 3 Dias)',
    description: 'Visualização linear dos prazos fatais com indicador de urgência e contagem regressiva.',
    priority: 'Alta',
    source: requestedPrazos ? 'Solicitado explicitamente' : 'Recomendado pela análise',
  });

  // Widget de Audiências / Compromissos
  if (lowerDash.includes('audiên') || lowerDash.includes('reuni') || lowerDash.includes('agend')) {
    recommendedWidgets.push({
      name: 'Agenda de Audiências e Compromissos',
      description: 'Linha do tempo dos compromissos formais do dia com links para os autos correspondentes.',
      priority: 'Alta',
      source: 'Solicitado explicitamente',
    });
  }

  // Widget de Tarefas / Pendências
  const requestedTarefas = lowerDash.includes('tarefa') || lowerDash.includes('pendên') || lowerDash.includes('fazer');
  recommendedWidgets.push({
    name: 'Radar de Tarefas e Ações Pendentes',
    description: 'Lista enxuta de providências atribuídas, filtradas pelo contexto do escritório.',
    priority: 'Média',
    source: requestedTarefas ? 'Solicitado explicitamente' : 'Recomendado pela análise',
  });

  // Widget de Comunicação / Clientes
  if (lowerDash.includes('client') || lowerDash.includes('atend') || lowerDash.includes('mensag') || selectedTimeSinks.includes('Atendimento / WhatsApp')) {
    recommendedWidgets.push({
      name: 'Central de Contatos & Clientes Aguardando',
      description: 'Painel compacto de mensagens recebidas ou atualizações de status pendentes de retorno.',
      priority: 'Média',
      source: (lowerDash.includes('client') || lowerDash.includes('atend')) ? 'Solicitado explicitamente' : 'Recomendado pela análise',
    });
  }

  // Widget de Intimações / Movimentações
  if (lowerDash.includes('process') || lowerDash.includes('despacho') || lowerDash.includes('moviment') || lowerDash.includes('intima')) {
    recommendedWidgets.push({
      name: 'Painel de Intimações e Despachos do Dia',
      description: 'Resumo das movimentações capturadas nas últimas 24 horas pendentes de triagem.',
      priority: 'Alta',
      source: 'Solicitado explicitamente',
    });
  }

  const section6_IdealDashboard = {
    explicitRequests: explicitDashboardRequests,
    recommendedWidgets,
    summary: idealDashboardRaw
      ? `A tela inicial deve priorizar os elementos explicitamente pontuados: "${idealDashboardRaw}".`
      : 'Sem solicitação expressa do profissional; recomenda-se uma tela inicial minimalista com foco estrito em prazos e tarefas imediatas (hipótese a validar).',
  };

  // -------------------------------------------------------------
  // SEÇÃO 7: RECOMENDAÇÕES PARA O DESENVOLVIMENTO DO SAAS
  // -------------------------------------------------------------
  const mvpFeatures: MVPFeature[] = [];
  const futureEvolutions: string[] = [];
  const simplificationGuidelines: string[] = [];

  // MVP Feature 1: Baseada no controle e prazos
  mvpFeatures.push({
    name: 'Controle de Prazos com Validação em 1 Clique',
    problemSolved: 'Insegurança no monitoramento de prazos e dispersão de datas.',
    evidence: `Relatado em controle operacional ("${operationalControlRaw || 'rotina atual'}") e tempo com prazos.`,
    priority: 'Alta',
    complexity: 'Média',
  });

  // MVP Feature 2: Baseada na principal tarefa a eliminar
  if (singleTaskToEliminateRaw) {
    mvpFeatures.push({
      name: `Módulo Específico: ${truncateText(singleTaskToEliminateRaw, 45)}`,
      problemSolved: `Eliminar a fricção declarada como prioritária número 1: "${singleTaskToEliminateRaw}".`,
      evidence: 'Resposta fornecida à Pergunta Final Complementar.',
      priority: 'Alta',
      complexity: 'Média',
    });
  }

  // MVP Feature 3: Baseada nas ferramentas / centralização
  mvpFeatures.push({
    name: 'Ficha Centralizada do Caso (Documentos + Histórico + Contato)',
    problemSolved: 'Documentos e conversas espalhadas entre WhatsApp, pastas na nuvem e planilhas.',
    evidence: `Ferramentas relatadas em uso: "${toolsReportedRaw || 'descentralizadas'}".`,
    priority: 'Alta',
    complexity: 'Baixa',
  });

  // MVP Feature 4: IA assistida (se solicitada)
  if (selectedAICapabilities.length > 0) {
    const topAICapability = selectedAICapabilities[0];
    mvpFeatures.push({
      name: `Assistente IA: ${topAICapability}`,
      problemSolved: 'Esforço manual em tarefas repetitivas cognitivas de triagem ou redação.',
      evidence: `Assinalado na Pergunta 09 como capacidade de IA prioritária.`,
      priority: 'Média',
      complexity: 'Média',
    });
  }

  // Futuras evoluções
  futureEvolutions.push('Integração direta e automática de captura com todos os tribunais regionais (PJe, Projudi, e-SAJ).');
  futureEvolutions.push('Disparo programado multicanal de notificações para clientes com trilha de auditoria.');
  if (answers.teamStructure && answers.teamStructure !== 'Sozinho') {
    futureEvolutions.push('Módulo avançado de métricas de produtividade e distribuição balanceada de carga da equipe.');
  }
  futureEvolutions.push('Editor de minutas com preenchimento preditivo treinado no histórico exclusivo do escritório.');

  // Diretrizes de simplificação
  simplificationGuidelines.push(
    `Interface Ultra-Focada: Semelhante ao modelo de trabalho de ${teamReported.toLowerCase()}, evitar telas carregadas com mais de 5 opções primárias simultâneas.`
  );
  simplificationGuidelines.push(
    'Transição Suave: Permitir importação via planilhas existentes ou listas simples, sem exigir cadastros preliminares extensos de centenas de campos.'
  );
  simplificationGuidelines.push(
    'Acesso Mobile Otimizado: Viabilizar consulta rápida a prazos e dados do cliente diretamente pelo celular durante audiências ou deslocamentos.'
  );

  const mvpProposalSummary =
    `Proposta de MVP: Focar inicialmente em um núcleo enxuto de Gestão de Prazos + Ficha Unificada de Casos + automação pontual da dor: "${singleTaskToEliminateRaw || 'organização de tarefas'}". Funcionalidades pesadas de ERP corporativo devem ser adiadas para ciclos posteriores de validação.`;

  const section7_SaaSRecommendations = {
    mvpFeatures,
    futureEvolutions,
    simplificationGuidelines,
    mvpProposalSummary,
  };

  // -------------------------------------------------------------
  // SEÇÃO 8: CONCLUSÃO & RESUMO EXECUTIVO
  // -------------------------------------------------------------
  const coreNeed = singleTaskToEliminateRaw || mainDifficultiesRaw || (selectedTimeSinks[0] ? `Gestão de ${selectedTimeSinks[0]}` : 'Estruturação de rotina operacional');
  const mainOpp = improvementItems[0]?.suggestedSolution || 'Centralização de processos e tarefas em fluxo unificado';
  const promisingAI = aiItems[0]?.suggestedAIApplication || 'Apoio em triagem e resumos preliminares';
  const firstStep = mvpFeatures[0]?.name || 'Validação de protótipo de controle simplificado de prazos';

  const unvalidatedPoints: string[] = [
    'Disponibilidade real da equipe ou do advogado para abandonar anotações paralelas ou planilhas auxiliares.',
    'Disposição para conectar credenciais de tribunais em uma plataforma em nuvem.',
    'Volume exato de mensagens semanais trocadas com clientes via canais informais.',
  ];

  const executiveSummary = {
    officeProfile: `${areaReported} · ${teamReported} · ${volumeReported}`,
    coreOperationalNeed: coreNeed,
    mainImprovementOpportunity: mainOpp,
    mostPromisingAIOpportunity: promisingAI,
    recommendedFirstStep: firstStep,
    unvalidatedPoints,
  };

  const section8_Conclusion = {
    officeContext: `O perfil diagnosticado (${areaReported}, ${teamReported.toLowerCase()}, volume de ${volumeReported.toLowerCase()}) demanda uma ferramenta com curva de aprendizado quase nula, que resolva imediatamente o atrito de "${coreNeed}".`,
    primaryFocalPoint: coreNeed,
    immediateNextStep: firstStep,
    validationChecklist: unvalidatedPoints,
    finalStatement:
      'A construção do SaaS não deve tentar replicar grandes sistemas legados cheios de burocracia. O diferencial competitivo residirá na velocidade operacional, no respeito ao fluxo natural de trabalho do advogado e na inserção precisa de inteligência artificial sempre sob supervisão humana rigorosa.',
  };

  return {
    id,
    generatedAt,
    isTestData: Boolean(answers.isTestData),
    testProfileName: answers.testProfileName,
    executiveSummary,
    section1_Profile,
    section2_WorkStructure,
    section3_Difficulties,
    section4_Improvements,
    section5_AIOpportunities,
    section6_IdealDashboard,
    section7_SaaSRecommendations,
    section8_Conclusion,
  };
}

function lowerDifficultiesOrAutomation(keyword: string, answers: SurveyAnswers): boolean {
  const k = keyword.toLowerCase();
  return (
    answers.mainDifficulties.toLowerCase().includes(k) ||
    answers.desiredAutomation.toLowerCase().includes(k) ||
    answers.singleTaskToEliminate.toLowerCase().includes(k)
  );
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}
