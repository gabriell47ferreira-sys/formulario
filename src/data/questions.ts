export interface QuestionDefinition {
  id: number;
  isSpecialFinal?: boolean;
  code: string;
  category: string;
  title: string;
  subtitle?: string;
  type: 'single-select' | 'multi-select' | 'text-open';
  placeholder?: string;
  options?: string[];
  allowOther?: boolean;
  otherPlaceholder?: string;
}

export const SURVEY_QUESTIONS: QuestionDefinition[] = [
  {
    id: 1,
    code: 'Q01',
    category: 'Área de atuação',
    title: 'Qual sua área principal de atuação?',
    subtitle: 'Selecione a área jurídica de maior concentração ou volume do seu escritório.',
    type: 'single-select',
    options: [
      'Previdenciário',
      'Trabalhista',
      'Cível',
      'Família e Sucessões',
      'Empresarial',
      'Criminal',
      'Tributário',
      'Outra',
    ],
    allowOther: true,
    otherPlaceholder: 'Especifique sua área de atuação...',
  },
  {
    id: 2,
    code: 'Q02',
    category: 'Estrutura do escritório',
    title: 'Você trabalha sozinho ou possui equipe?',
    subtitle: 'Compreender a escala de colaboradores auxilia na identificação de gargalos de comunicação.',
    type: 'single-select',
    options: [
      'Sozinho',
      '2–3 pessoas',
      '4–10 pessoas',
      '10+ pessoas',
    ],
  },
  {
    id: 3,
    code: 'Q03',
    category: 'Volume operacional',
    title: 'Aproximadamente quantos clientes ou processos você acompanha atualmente?',
    subtitle: 'Faixa estimada de processos ativos e clientes sob gestão simultânea.',
    type: 'single-select',
    options: [
      'Até 20',
      '20–50',
      '50–100',
      '100–300',
      'Mais de 300',
    ],
  },
  {
    id: 4,
    code: 'Q04',
    category: 'Ferramentas utilizadas',
    title: 'Quais ferramentas você utiliza atualmente para organizar o escritório?',
    subtitle: 'Softwares, canais de mensageria, nuvem de arquivos e controle operacional.',
    type: 'text-open',
    placeholder: 'Ex.: sistema jurídico + WhatsApp + Google Drive + planilhas.',
  },
  {
    id: 5,
    code: 'Q05',
    category: 'Controle operacional',
    title: 'Como você controla atualmente processos, prazos e tarefas?',
    subtitle: 'Mapeamento do fluxo real de controle: ferramentas dedicadas ou rotinas manuais.',
    type: 'text-open',
    placeholder: 'Ex.: sistema jurídico, agenda, planilha, anotações ou manualmente.',
  },
  {
    id: 6,
    code: 'Q06',
    category: 'Principais dificuldades',
    title: 'Qual é a maior dificuldade ou problema que você enfrenta hoje na organização do escritório?',
    subtitle: 'Descreva os momentos de maior atrito, perda de tempo ou sensação de sobrecarga.',
    type: 'text-open',
    placeholder: 'Ex.: documentos espalhados, controle de prazos, atendimento ou encontrar informações.',
  },
  {
    id: 7,
    code: 'Q07',
    category: 'Consumo de tempo',
    title: 'O que mais toma seu tempo durante o dia?',
    subtitle: 'Selecione todas as atividades que consomem parcelas expressivas da sua jornada.',
    type: 'multi-select',
    options: [
      'Prazos',
      'Documentos',
      'Atendimento / WhatsApp',
      'Acompanhamento de processos',
      'Elaborar documentos / peças',
      'Cadastro de informações',
      'Financeiro / cobranças',
      'Organização da equipe',
      'Outro',
    ],
    allowOther: true,
    otherPlaceholder: 'Especifique outra atividade...',
  },
  {
    id: 8,
    code: 'Q08',
    category: 'Automação desejada',
    title: 'Qual tarefa você mais gostaria de automatizar?',
    subtitle: 'Indique aquilo que você gostaria que acontecesse automaticamente no seu dia a dia.',
    type: 'text-open',
    placeholder: 'Ex.: organizar documentos, avisar sobre prazos, resumir processos ou responder clientes.',
  },
  {
    id: 9,
    code: 'Q09',
    category: 'Inteligência artificial',
    title: 'Se tivesse uma IA dentro do sistema, o que você gostaria que ela fizesse?',
    subtitle: 'Selecione os casos de uso de IA mais alinhados à sua necessidade real.',
    type: 'multi-select',
    options: [
      'Resumir processos / documentos',
      'Organizar documentos',
      'Encontrar informações',
      'Criar rascunhos',
      'Identificar prazos e tarefas',
      'Preparar respostas para clientes',
      'Outra',
    ],
    allowOther: true,
    otherPlaceholder: 'Especifique outro caso de uso...',
  },
  {
    id: 10,
    code: 'Q10',
    category: 'Dashboard ideal',
    title: 'Imagine que você abre o sistema pela manhã. O que gostaria de ver primeiro?',
    subtitle: 'As informações de maior prioridade visual no momento em que você inicia a jornada.',
    type: 'text-open',
    placeholder: 'Ex.: prazos de hoje, audiências, tarefas pendentes e processos que precisam de atenção.',
  },
  {
    id: 11,
    isSpecialFinal: true,
    code: 'ETAPA ESPECIAL',
    category: 'Pergunta final complementar',
    title: 'Se pudesse eliminar UMA tarefa do seu dia usando tecnologia, qual seria?',
    subtitle: 'Etapa especial de encerramento do questionário. Essa resposta fundamenta a prioridade zero do produto.',
    type: 'text-open',
    placeholder: 'Descreva a tarefa mais desgastante ou repetitiva que você gostaria de eliminar...',
  },
];
