# Infraestrutura Local de Dados da 4CETY

Arquitetura de armazenamento local e relacional desenvolvida para a **4CETY**, garantindo soberania total dos dados no computador local, sem dependência de bancos de dados em nuvem ou serviços de terceiros, mantendo o frontend pronto para versionamento no GitHub e hospedagem na Vercel.

---

## 1. Arquitetura Geral

- **Banco de Dados Relacional:** SQLite nativo (`node:sqlite` do Node.js v24), armazenado em arquivo persistente (`data/cety.sqlite`).
- **Integridade & Desempenho:**
  - `PRAGMA foreign_keys = ON;` (integridade referencial ativa).
  - `PRAGMA journal_mode = WAL;` (Write-Ahead Logging para concorrência de leitura e escrita sem travamento).
  - `PRAGMA busy_timeout = 5000;`.
- **Armazenamento de PDFs:** Diretório isolado `storage/pdfs/` com validação estrita de Magic Bytes (`%PDF-`), cálculo de hash SHA-256 e proteção contra Path Traversal.
- **Camada de Backup & Restauração:** Procedimento transacional com manifestos JSON contendo hashes SHA-256 de verificação.
- **Isolamento de Segurança:** Banco de dados, documentos PDF, backups e variáveis de ambiente privadas são bloqueados no `.gitignore` para nunca subirem ao GitHub.

---

## 2. Esquema do Banco de Dados

### Tabela: `survey_responses`
Armazena as respostas das pesquisas jurídicas coletadas pela 4CETY:
- `id` (TEXT PRIMARY KEY): Identificador único (`SUB-...`).
- `practice_area` (TEXT NOT NULL): Área de atuação jurídica.
- `team_size` (TEXT NOT NULL): Estrutura de equipe do escritório.
- `caseload` (TEXT NOT NULL): Volume de processos ou clientes.
- `current_tools` (TEXT): Ferramentas em uso atual.
- `deadline_management` (TEXT): Método de controle de prazos e tarefas.
- `main_pain_point` (TEXT): Principal gargalo relatado.
- `time_consuming_tasks` (TEXT): Atividades que mais consomem tempo (JSON Array).
- `desired_automation` (TEXT): Tarefa que o advogado deseja automatizar.
- `desired_ai_features` (TEXT): Casos de uso de IA desejados (JSON Array).
- `morning_dashboard` (TEXT): O que deseja visualizar ao iniciar o dia.
- `task_to_eliminate` (TEXT): Tarefa que eliminaria com tecnologia.
- `status` (TEXT NOT NULL DEFAULT 'PENDENTE'): Status da análise (`PENDENTE`, `ANALISADO`, `ERRO_ANALISE`).
- `report_id` (TEXT): ID do relatório estratégico vinculado.
- `report_data` (TEXT): JSON do relatório gerado com as 8 seções analíticas.
- `is_test_data` (INTEGER): Flag `1` para dados de teste ou `0` para submissões reais.
- `test_profile_name` (TEXT): Rótulo de identificação de perfil simulado.
- `created_at` (TEXT NOT NULL) / `updated_at` (TEXT NOT NULL): Timestamps ISO 8601.

### Tabela: `stored_documents`
Armazena os metadados dos PDFs gravados no computador:
- `id` (TEXT PRIMARY KEY): Identificador único (`DOC-...`).
- `response_id` (TEXT REFERENCES survey_responses(id) ON DELETE SET NULL): Chave estrangeira para a resposta associada.
- `original_filename` (TEXT NOT NULL): Nome original sanitizado.
- `storage_filename` (TEXT NOT NULL UNIQUE): Nome interno seguro no disco.
- `relative_path` (TEXT NOT NULL): Caminho relativo dentro do armazenamento local (`storage/pdfs/...`).
- `mime_type` (TEXT NOT NULL): Tipo MIME validado (`application/pdf`).
- `size_bytes` (INTEGER NOT NULL): Tamanho exato em bytes.
- `sha256` (TEXT NOT NULL): Hash criptográfico para validação de integridade.
- `created_at` (TEXT NOT NULL): Timestamp de gravação.

### Tabela: `schema_migrations`
Controle versionado de migrações (`version`, `name`, `applied_at`).

---

## 3. Armazenamento e Validação de PDFs

1. **Magic Bytes:** Antes de gravar qualquer arquivo no disco, os primeiros bytes são examinados diretamente na memória. Arquivos que não contêm o cabeçalho `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`) são rejeitados com erro, mesmo que o cliente tenha forjado a extensão `.pdf` ou o header `Content-Type`.
2. **Defesa contra Path Traversal:** O nome do arquivo passa por sanitização estrita via `path.basename` e remoção de caracteres de controle, e o acesso é confinado ao diretório configurado.
3. **Atomicidade e Rollback:** Se o arquivo for gravado mas a gravação no SQLite falhar, o arquivo é imediatamente removido do disco. Se a gravação no disco falhar, o banco não é alterado.
4. **Acesso Restrito:** Nenhum arquivo PDF é servido como arquivo estático público. O download exige autenticação administrativa via endpoint `GET /api/admin/documents/:id`.

---

## 4. Procedimentos de Backup e Restauração

### Executar Backup Manual
Gera um backup transacional do SQLite com checkpoint WAL e copia todos os PDFs correspondentes:
```powershell
npm run backup
```
O backup é armazenado em `backups/backup-YYYY-MM-DDTHH-mm-ss/` contendo:
- `cety.sqlite`: Cópia íntegra do banco.
- `pdfs/`: Pasta com os PDFs.
- `manifest.json`: Manifesto contendo o hash SHA-256 do SQLite e de cada documento para validação.

### Restaurar Backup
Restaura o estado exato dos dados a partir de uma pasta de backup validada:
```powershell
npx tsx scripts/restore.ts backups/backup-2026-10-19T18-29-03-732Z
```
O procedimento valida o hash SHA-256 do arquivo antes de restaurar, garantindo que nenhum backup corrompido seja aplicado.

> **Importante:** Manter cópias exclusivamente no mesmo disco rígido não protege contra falhas físicas de hardware, perda ou roubo do computador. Recomenda-se sincronizar periodicamente a pasta `backups/` para uma unidade externa ou pendrive criptografado.

---

## 5. Compatibilidade com GitHub e Vercel

### Cenário de Hospedagem
- **Repositório GitHub:** O código-fonte do frontend e backend é versionado normalmente. O `.gitignore` protege os dados privados (`data/*.sqlite*`, `storage/`, `backups/`, `.env`).
- **Frontend na Vercel:** O frontend React compilado pode ser hospedado na Vercel ou qualquer CDN estática.
- **Backend Local da 4CETY:** Como o SQLite e os PDFs residem no computador local, as funções serverless da Vercel não têm acesso ao disco rígido local.

### Como Conectar a Vercel ao Computador Local da 4CETY:
### Como Conectar a Vercel ao Computador Local da 4CETY:
Para que formulários respondidos na Vercel alcancem o backend local de forma segura e soberana:

#### Opção A: Cloudflare Tunnel (Recomendada — Gratuita, HTTPS Automático, Sem Abertura de Portas)
1. Instale o utilitário oficial da Cloudflare no Windows via PowerShell:
   ```powershell
   winget install Cloudflare.cloudflared
   ```
2. Realize o login e crie o túnel para o backend da 4CETY:
   ```powershell
   cloudflared tunnel login
   cloudflared tunnel create cety-backend
   ```
3. Associe uma URL segura ao seu túnel apontando para o backend local (porta 3001):
   ```powershell
   cloudflared tunnel route dns cety-backend api-local.suaempresa.com
   cloudflared tunnel run --url http://localhost:3001 cety-backend
   ```
4. No painel da **Vercel** do seu projeto:
   - Acesse **Settings > Environment Variables**.
   - Adicione: `VITE_API_URL=https://api-local.suaempresa.com`
   - Realize um novo Deploy.
5. No arquivo `.env` do seu computador local:
   - Configure: `CORS_ALLOWED_ORIGIN=https://seu-projeto.vercel.app`

#### Opção B: Tailscale Funnel (Ideal para Acesso P2P Criptografado)
1. Instale o Tailscale no computador.
2. Ative o Funnel na porta do backend:
   ```powershell
   tailscale funnel 3001
   ```
3. Configure o domínio gerado pelo Tailscale como `VITE_API_URL` na Vercel.

### Resiliência Quando o Computador Estiver Desligado:
- Se o computador local estiver desligado ou sem internet, o formulário na Vercel exibe uma mensagem amigável e transparente ao advogado, informando que o servidor seguro de processamento está temporariamente offline.
- As respostas preenchidas permanecem 100% salvas no navegador do advogado (LocalStorage) como rascunho automático, permitindo que ele clique em "Enviar" assim que o servidor voltar a operar, sem perda de dados.

---

## 6. Comandos e Operação Diária

```powershell
# 1. Executar servidor backend + frontend em desenvolvimento
npm run dev

# 2. Executar apenas o backend local (porta 3001)
npm run dev:server

# 3. Aplicar migrações do banco SQLite
npm run db:migrate

# 4. Executar bateria de auditoria técnica completa (22 pontos obrigatórios)
npm run test:audit

# 5. Executar todas as suítes de teste (Analítico, Segurança e Auditoria de Banco)
npm test

# 6. Criar backup consistente atômico com manifesto SHA-256 (via VACUUM INTO)
npm run backup

# 7. Restaurar backup para o banco ativo (validação estrita de checksums)
npx tsx scripts/restore.ts backups/backup-YYYY-MM-DDTHH-mm-ss

# 8. Compilar frontend para publicação na Vercel
npm run build
```
