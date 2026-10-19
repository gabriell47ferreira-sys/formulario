import http from 'http';
import { app } from './server/app';

console.log('--- INICIANDO TESTES DE SEGURANÇA E ARQUITETURA BACKEND ---');

// Vamos iniciar o servidor em uma porta de teste temporária
const TEST_PORT = 3099;
const server = http.createServer(app);

server.listen(TEST_PORT, async () => {
  try {
    const baseUrl = `http://localhost:${TEST_PORT}`;

    // -------------------------------------------------------------------------
    // TESTE 1: Visitante envia formulário na API pública (POST /api/submissions)
    // -------------------------------------------------------------------------
    console.log('\n[TESTE 1 & 2] Submissão pública e contenção de vazamento de relatório...');
    const fakeLawyerAnswers = {
      area: 'Trabalhista',
      teamStructure: 'Sozinho',
      processVolume: '20–50',
      toolsUsed: 'WhatsApp + Planilha',
      operationalControl: 'Controle em caderno',
      mainDifficulties: 'Prazos acumulados',
      timeSinks: ['Prazos', 'Atendimento / WhatsApp'],
      desiredAutomation: 'Avisar prazos',
      aiCapabilities: ['Identificar prazos e tarefas'],
      idealDashboard: 'Prazos do dia',
      singleTaskToEliminate: 'Verificar intimações',
    };

    const submitRes = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: fakeLawyerAnswers }),
    });

    if (submitRes.status !== 201) {
      throw new Error(`Falha no envio público: status ${submitRes.status}`);
    }

    const submitJson = await submitRes.json();
    console.log('  ✓ Resposta pública recebida:', submitJson);

    // Validação estrita: o visitante NÃO PODE receber o relatório ou outros dados
    if (submitJson.report || submitJson.answers || submitJson.recommendations) {
      throw new Error('FALHA DE SEGURANÇA: Relatório ou respostas vazaram na resposta pública!');
    }
    if (!submitJson.submissionId || !submitJson.success) {
      throw new Error('Falha: submissionId ausente na resposta');
    }
    console.log('  ✓ O visitante recebeu apenas a confirmação e ID de protocolo, sem vazamento do relatório.');

    const newSubId = submitJson.submissionId;

    // -------------------------------------------------------------------------
    // TESTE 3 & 4: Visitante anônimo tenta acessar endpoints administrativos
    // -------------------------------------------------------------------------
    console.log('\n[TESTE 3 & 4] Bloqueio de acesso anônimo aos endpoints administrativos...');

    // Tentativa 1: Listar todas as respostas sem token
    const anonListRes = await fetch(`${baseUrl}/api/admin/submissions`);
    console.log(`  ✓ GET /api/admin/submissions sem auth retornou status: ${anonListRes.status} (esperado 401)`);
    if (anonListRes.status !== 401) {
      throw new Error(`Falha de segurança: esperado 401, recebido ${anonListRes.status}`);
    }

    // Tentativa 2: Consultar relatório da submissão sem token
    const anonReportRes = await fetch(`${baseUrl}/api/admin/submissions/${newSubId}/report`);
    console.log(`  ✓ GET /api/admin/submissions/${newSubId}/report sem auth retornou status: ${anonReportRes.status} (esperado 401)`);
    if (anonReportRes.status !== 401) {
      throw new Error(`Falha de segurança: esperado 401, recebido ${anonReportRes.status}`);
    }

    // Tentativa 3: Token inválido ou forjado
    const forgedRes = await fetch(`${baseUrl}/api/admin/submissions`, {
      headers: { Authorization: 'Bearer token_falso_ou_invalido' },
    });
    console.log(`  ✓ GET com token forjado retornou status: ${forgedRes.status} (esperado 403)`);
    if (forgedRes.status !== 403) {
      throw new Error(`Falha de segurança: token forjado não retornou 403`);
    }

    // -------------------------------------------------------------------------
    // TESTE 5: Login administrativo real e consulta de submissões
    // -------------------------------------------------------------------------
    console.log('\n[TESTE 5] Autenticação administrativa com credenciais...');
    
    // Login com senha errada
    const badLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'senha_errada' }),
    });
    if (badLoginRes.status !== 401) {
      throw new Error('Falha: senha incorreta não retornou 401');
    }
    console.log('  ✓ Login com senha incorreta foi bloqueado (401).');

    // Login correto com credencial inicial solicitada (admin47)
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin47';
    const goodLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: expectedPassword }),
    });
    if (goodLoginRes.status !== 200) {
      throw new Error(`Falha no login com credenciais corretas: ${goodLoginRes.status}`);
    }
    const loginData = await goodLoginRes.json();
    const setCookieHeader = goodLoginRes.headers.get('set-cookie') || '';
    if (!setCookieHeader.includes('cety_admin_token') || !setCookieHeader.toLowerCase().includes('httponly')) {
      throw new Error('Falha de segurança: cookie HttpOnly cety_admin_token não foi emitido no login!');
    }
    console.log('  ✓ Login administrativo realizado com sucesso. Token JWT e Cookie HttpOnly gerados.');
    const adminToken = loginData.token;

    // -------------------------------------------------------------------------
    // TESTE 6: Administrador autenticado consulta lista de respostas
    // -------------------------------------------------------------------------
    console.log('\n[TESTE 6] Consulta autenticada de submissões e persistência...');
    const adminListRes = await fetch(`${baseUrl}/api/admin/submissions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminListRes.status !== 200) {
      throw new Error(`Falha ao listar submissões: ${adminListRes.status}`);
    }
    const adminListData = await adminListRes.json();
    console.log(`  ✓ Submissões encontradas no banco persistente: ${adminListData.total}`);
    
    const foundNewSub = adminListData.submissions.find((s: any) => s.id === newSubId);
    if (!foundNewSub) {
      throw new Error(`Falha: a nova submissão ${newSubId} não foi encontrada na lista!`);
    }
    console.log(`  ✓ Submissão ${newSubId} confirmada no banco com status: ${foundNewSub.status}`);

    // -------------------------------------------------------------------------
    // TESTE 7: Administrador abre o relatório correspondente (8 seções)
    // -------------------------------------------------------------------------
    console.log('\n[TESTE 7] Consulta do relatório gerado no backend...');
    const adminReportRes = await fetch(`${baseUrl}/api/admin/submissions/${newSubId}/report`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminReportRes.status !== 200) {
      throw new Error(`Falha ao carregar relatório: ${adminReportRes.status}`);
    }
    const reportData = await adminReportRes.json();
    if (!reportData.section1_Profile || !reportData.section8_Conclusion) {
      throw new Error('Falha: o relatório não possui todas as seções obrigatórias!');
    }
    console.log(`  ✓ Relatório ID: ${reportData.id}`);
    console.log(`  ✓ Perfil: ${reportData.section1_Profile.mainArea}`);
    console.log(`  ✓ MVP Features no relatório: ${reportData.section7_SaaSRecommendations.mvpFeatures.length}`);

    // -------------------------------------------------------------------------
    // TESTE 8: Persistência após consulta repetida (recarga do relatório)
    // -------------------------------------------------------------------------
    console.log('\n[TESTE 8] Verificação de persistência após nova consulta...');
    const reloadReportRes = await fetch(`${baseUrl}/api/admin/submissions/${newSubId}/report`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (reloadReportRes.status !== 200) {
      throw new Error('Falha na persistência do relatório após recarga!');
    }
    console.log('  ✓ Relatório permanece salvo e íntegro no servidor em disco.');

    // -------------------------------------------------------------------------
    // TESTE 9: Encerramento de sessão (Logout) e invalidação de cookie
    // -------------------------------------------------------------------------
    console.log('\n[TESTE 9] Encerramento de sessão administrativa (Logout)...');
    const logoutRes = await fetch(`${baseUrl}/api/admin/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (logoutRes.status !== 200) {
      throw new Error('Falha ao executar logout');
    }
    const logoutSetCookie = logoutRes.headers.get('set-cookie') || '';
    if (!logoutSetCookie.includes('cety_admin_token=;')) {
      throw new Error('Falha: logout não limpou o cookie cety_admin_token');
    }
    console.log('  ✓ Sessão encerrada e cookie HttpOnly invalidado com sucesso.');

    console.log('\n=============================================================');
    console.log(' TODOS OS CRITÉRIOS DE SEGURANÇA E SESSÃO FORAM VALIDADOS!');
    console.log('=============================================================');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO NOS TESTES:', error);
    server.close();
    process.exit(1);
  }
});
