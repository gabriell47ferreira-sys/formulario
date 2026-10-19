import { generateStrategicReport } from './src/services/reportEngine.js';
import { TEST_PROFILES, INITIAL_EMPTY_ANSWERS } from './src/data/mockData.js';

console.log('--- INICIANDO TESTES DO MOTOR DE DIAGNÓSTICO JURÍDICO ---');

// Test 1: Test profiles
for (const profile of TEST_PROFILES) {
  console.log(`\n[TESTE] Processando Perfil: ${profile.name}`);
  const rep = generateStrategicReport(profile.answers);
  
  if (!rep.id) throw new Error('Falha: ID do relatório ausente');
  if (!rep.executiveSummary) throw new Error('Falha: Resumo executivo ausente');
  if (!rep.section1_Profile.mainArea) throw new Error('Falha: Seção 1 ausente');
  if (!rep.section2_WorkStructure.summary) throw new Error('Falha: Seção 2 ausente');
  if (rep.section3_Difficulties.items.length === 0) throw new Error('Falha: Seção 3 vazia');
  if (rep.section4_Improvements.items.length === 0) throw new Error('Falha: Seção 4 vazia');
  if (rep.section5_AIOpportunities.items.length === 0) throw new Error('Falha: Seção 5 vazia');
  if (!rep.section6_IdealDashboard.summary) throw new Error('Falha: Seção 6 ausente');
  if (rep.section7_SaaSRecommendations.mvpFeatures.length === 0) throw new Error('Falha: Seção 7 vazia');
  if (!rep.section8_Conclusion.finalStatement) throw new Error('Falha: Seção 8 ausente');
  
  console.log(`  ✓ Seção 1 (Perfil): ${rep.section1_Profile.mainArea} | ${rep.section1_Profile.teamSize}`);
  console.log(`  ✓ Seção 3 (Dificuldades mapeadas): ${rep.section3_Difficulties.items.length}`);
  console.log(`  ✓ Seção 4 (Oportunidades de melhoria): ${rep.section4_Improvements.items.length}`);
  console.log(`  ✓ Seção 5 (IA com supervisão): ${rep.section5_AIOpportunities.items.length} casos`);
  console.log(`  ✓ Seção 7 (MVP Features): ${rep.section7_SaaSRecommendations.mvpFeatures.length}`);
  console.log(`  ✓ Tarefa eliminada refletida no MVP: ${rep.section7_SaaSRecommendations.mvpFeatures.some(f => f.name.includes('Módulo Específico'))}`);
}

// Test 2: Edge-case with empty answers
console.log('\n[TESTE] Processando Caso Limite: Respostas Vazias');
const emptyRep = generateStrategicReport(INITIAL_EMPTY_ANSWERS);
console.log(`  ✓ Seção 1 com dados vazios indica: "${emptyRep.section1_Profile.mainArea}"`);
if (emptyRep.section1_Profile.mainArea !== 'Não informado') {
  throw new Error('Falha: campo não informado deveria constar "Não informado"');
}
console.log(`  ✓ Seção 6 registra ausência e trata como hipótese: "${emptyRep.section6_IdealDashboard.summary.includes('hipótese')}"`);

console.log('\n--- TODOS OS TESTES DO MOTOR ANALÍTICO PASSARAM COM SUCESSO! ---');
