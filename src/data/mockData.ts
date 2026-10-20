import { SurveyAnswers } from '../types/survey';

export interface TestProfile {
  id: string;
  name: string;
  description: string;
  answers: SurveyAnswers;
}

export const TEST_PROFILES: TestProfile[] = [
  {
    id: 'test_previdenciario_solo',
    name: '[DADOS DE TESTE] Dr. Marcos — Previdenciário Autônomo',
    description: 'Atuação solo com alto volume de clientes e sobrecarga no WhatsApp e conferência de prazos.',
    answers: {
      area: 'Previdenciário',
      teamStructure: 'Sozinho',
      processVolume: '100–300',
      toolsUsed: 'WhatsApp Business + Google Drive + planilhas Excel + anotações em caderno físico',
      operationalControl: 'Controlo prazos na agenda do Google e planilha. Processos consulto no portal do INSS/Justiça Federal e anoto as pendências manualmente.',
      mainDifficulties: 'Mensagens constantes no WhatsApp de clientes perguntando "como está meu benefício", documentos de comprovação de tempo espalhados em pastas e medo de perder publicação de prazo.',
      timeSinks: [
        'Atendimento / WhatsApp',
        'Documentos',
        'Prazos',
        'Cadastro de informações'
      ],
      desiredAutomation: 'Organizar documentos comprobatórios por cliente e avisar automaticamente os clientes sobre o andamento sem que eu precise responder um a um.',
      aiCapabilities: [
        'Resumir processos / documentos',
        'Organizar documentos',
        'Preparar respostas para clientes',
        'Identificar prazos e tarefas'
      ],
      idealDashboard: 'Prazos que vencem nos próximos 5 dias, clientes aguardando resposta crítica e novos despachos do dia.',
      singleTaskToEliminate: 'Responder clientes no WhatsApp sobre status repetitivo de andamento processual.',
      isTestData: true,
      testProfileName: 'Dr. Marcos — Previdenciário Autônomo'
    }
  },
  {
    id: 'test_civel_equipe',
    name: '[DADOS DE TESTE] Dra. Helena — Cível & Contratual (Equipe 4–10)',
    description: 'Escritório com equipe pequena enfrentando gargalo em revisão de peças e centralização de tarefas.',
    answers: {
      area: 'Cível',
      teamStructure: '4–10 pessoas',
      processVolume: '100–300',
      toolsUsed: 'Sistema jurídico legado antigo + Microsoft Teams + OneDrive + Trello',
      operationalControl: 'Cada advogado alimenta o sistema como prefere. Usamos o Trello para tarefas e reuniões semanais para alinhar prazos.',
      mainDifficulties: 'Falta de padrão no cadastro dos processos pela equipe e demora na elaboração/revisão de minutas e peças complexas.',
      timeSinks: [
        'Elaborar documentos / peças',
        'Organização da equipe',
        'Acompanhamento de processos',
        'Prazos'
      ],
      desiredAutomation: 'Gerar primeiros rascunhos de contestações e recursos com base no histórico do caso e padronizar o fluxo de revisão interna.',
      aiCapabilities: [
        'Criar rascunhos',
        'Resumir processos / documentos',
        'Encontrar informações',
        'Identificar prazos e tarefas'
      ],
      idealDashboard: 'Peças pendentes de revisão dos advogados juniores, prazos fatais da semana por responsável e audiências agendadas.',
      singleTaskToEliminate: 'Redigir do zero peças repetitivas e cobrar status interno de tarefas da equipe.',
      isTestData: true,
      testProfileName: 'Dra. Helena — Cível & Contratual'
    }
  },
  {
    id: 'test_trabalhista_medio',
    name: '[DADOS DE TESTE] Dr. Renan — Trabalhista (2–3 pessoas)',
    description: 'Volume operacional relevante com controle em planilhas e atrito com prazos de cálculos.',
    answers: {
      area: 'Trabalhista',
      teamStructure: '2–3 pessoas',
      processVolume: '50–100',
      toolsUsed: 'Google Workspace + Notion + WhatsApp + PJe direto no navegador',
      operationalControl: 'Avisos de intimação chegam por e-mail e nós lançamos em uma tabela compartilhada no Notion. Não temos software jurídico formal.',
      mainDifficulties: 'Conciliar a triagem diária de intimações do PJe com a elaboração de cálculos e atendimento a testemunhas e reclamantes.',
      timeSinks: [
        'Prazos',
        'Acompanhamento de processos',
        'Atendimento / WhatsApp',
        'Elaborar documentos / peças'
      ],
      desiredAutomation: 'Ler as intimações do diário oficial e sugerir automaticamente o prazo e a tarefa correspondente na agenda.',
      aiCapabilities: [
        'Identificar prazos e tarefas',
        'Resumir processos / documentos',
        'Encontrar informações'
      ],
      idealDashboard: 'Intimações recebidas nas últimas 24 horas já classificadas por urgência, audiências da semana e tarefas delegadas.',
      singleTaskToEliminate: 'Fazer a leitura diária e manual de notas de expediente e alimentar planilhas de prazo.',
      isTestData: true,
      testProfileName: 'Dr. Renan — Trabalhista'
    }
  }
];

export const INITIAL_EMPTY_ANSWERS: SurveyAnswers = {
  area: '',
  areaOther: '',
  teamStructure: '',
  processVolume: '',
  toolsUsed: '',
  operationalControl: '',
  mainDifficulties: '',
  timeSinks: [],
  timeSinksOther: '',
  desiredAutomation: '',
  aiCapabilities: [],
  aiCapabilitiesOther: '',
  idealDashboard: '',
  singleTaskToEliminate: '',
  isTestData: false
};
