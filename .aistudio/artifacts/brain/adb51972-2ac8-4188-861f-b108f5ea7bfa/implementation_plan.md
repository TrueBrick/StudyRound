# StudyRound - Planejamento e Especificação Técnica

Plataforma gamificada voltada para estudantes iniciantes, integrando gestão de metas e objetivos de estudo, cronômetros de foco Pomodoro, motor de recompensas contínuas, sincronização em tempo real e privacidade com criptografia de ponta a ponta.

---

## 1. Problema e Otimização do Fluxo de Trabalho (Workflow)

### O Problema do Estudante Iniciante
Estudantes em início de jornada (concursos, vestibulares, transição de carreira ou faculdade) enfrentam três gargalos comportamentais e cognitivos:
1. **Sobrecarga e Paralisia por Análise:** Dificuldade em fatiar grandes ementas em objetivos diários executáveis (falta de clareza).
2. **Procrastinação e Perda de Foco:** Ausência de ritmo estruturado e dispersão causada por notificações e multitarefa.
3. **Ausência de Recompensa Imediata (Dopamine Gap):** Estudar é um investimento com recompensa a longo prazo; sem retorno tangível a curto prazo, a taxa de desistência nos primeiros 14 dias ultrapassa 70%.
4. **Fricção de Ferramentas Desconectadas:** Alternar entre uma planilha/Trello, um app de cronômetro avulso e um bloco de notas gera dispersão cognitiva (*context switching*).

### Como o StudyRound Otimiza o Fluxo de Trabalho
O **StudyRound** unifica o ciclo de produtividade acadêmica em um único fluxo circular contínuo:
- **Planejar (Input Rápido):** Cadastrar objetivos com título, descrição, prazo e status em segundos.
- **Executar (Deep Work):** Acionar um Pomodoro diretamente vinculado ao objetivo ativo, bloqueando distrações visuais e contabilizando minutos de foco líquido.
- **Recompensar (Gamificação Imediata):** Ao encerrar um bloco ou concluir um objetivo, o estudante ganha EXP, sobe de nível, mantém streaks e acumula *StudyCoins* para desbloquear itens cosméticos.
- **Analisar & Iterar (Feedback Loop):** O painel de estatísticas devolve insights imediatos sobre horas estudadas, consistência e matérias concluídas.

---

## 2. Público-Alvo e Escopo do MVP (Para Testes de Usabilidade)

### Personas Principais
1. **O Vestibulando / Enem (16-20 anos):** Precisa de rotina rígida, vence o cansaço através de streaks e gamificação com amigos.
2. **O Concurseiro Iniciante (22-38 anos):** Pouco tempo livre (concilia com trabalho), necessita de cronometragens exatas de horas líquidas e foco absoluto.
3. **O Estudante Universitário / Autodidata Tech:** Lida com múltiplos prazos de projetos e busca autonomia e visualização clara de progresso diário.

### Recorte Estratégico: MVP (Versão 1.0) vs. Roadmap

| Módulo | Escopo do MVP (Fase 1 - Testes Rápidos) | Roadmap Incremental (Fase 2 & 3) |
| :--- | :--- | :--- |
| **Objetivos** | CRUD completo (título, descrição, prazo, status), filtro por status e priorização visual. | Subtarefas aninhadas, anexos e tags inteligentes. |
| **Temporizador** | Pomodoro vinculado (25/5 min + pausa longa 15 min), sons de alerta e registro de tempo na tarefa. | White noise integrado (lo-fi, chuva), modo tela cheia zen. |
| **Gamificação** | XP por minuto focado e tarefa concluída, Níveis (1 a 50), Streaks diários e Badges essenciais. | Loja de avatares com StudyCoins, árvore de habilidades, rankings de amigos. |
| **Persistência & Sync** | Sincronização Local (IndexedDB/localStorage) + Sincronização em nuvem via Conta de Usuário. | Conflito multi-dispositivo CRDT em tempo real. |
| **Offline & PWA** | PWA instalável, funcionamento 100% offline com fila de sincronização em segundo plano. | Background Sync API avançada. |
| **Segurança & E2EE** | Criptografia no cliente (AES-GCM 256) para anotações e conteúdos dos objetivos. | Compartilhamento criptografado de resumos entre pares. |
| **Relatórios & Export** | Dashboard com gráficos (horas por dia/semana) + Exportação instantânea em CSV e PDF. | Relatório preditivo com estimativa de conclusão da ementa. |
| **UX & Acessibilidade**| Modo escuro/claro com alto contraste, design responsivo mobile/desktop. | Temas personalizáveis extras (Cyberpunk, Café, Floresta). |

---

## 3. Tecnologias Sugeridas

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA / PWA)                            │
│  React 19 + TypeScript + Vite                                          │
│  Tailwind CSS v4 + Motion (Animações de recompensa)                    │
│  Lucide Icons + Canvas Confetti                                        │
│  Web Workers (Timer Preciso) + Web Crypto API (E2EE AES-GCM)           │
│  IndexedDB (Dexie.js / Local Store) + Service Worker (PWA + Offline)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST / WSS / SSE
┌───────────────────────────────────▼────────────────────────────────────┐
│                        BACKEND & PERSISTÊNCIA                          │
│  Node.js + Express (API RESTful + Endpoints de Sincronização)           │
│  Firebase Firestore (Tempo real) OU PostgreSQL (Prisma/Drizzle)        │
│  JWT / Firebase Auth (Autenticação Multi-dispositivo)                  │
│  Web Push API (VAPID Keys para notificações push em segundo plano)     │
└────────────────────────────────────────────────────────────────────────┘
```

- **Frontend:**
  - **Framework:** React 19 com TypeScript e Vite (alta performance e tipagem rigorosa).
  - **Estilização:** Tailwind CSS v4 para suporte nativo a temas (Light/Dark) e responsividade fluida.
  - **Microinterações e Gamificação:** `motion` para animações fluidas de subida de nível, conquistas e `canvas-confetti` para celebrações de metas.
  - **Gráficos:** Recharts ou Chart.js para dashboards de tempo de foco e progresso.
  - **Armazenamento Offline:** IndexedDB / Cache API para garantir que o estudante nunca perca um segundo de estudo sem internet.
  - **Criptografia:** `crypto.subtle` (Web Crypto API) padrão W3C para cifragem de ponta a ponta (AES-GCM 256-bit) antes de enviar para o servidor.
- **Backend & Serviços:**
  - **Servidor:** Node.js com Express e TypeScript.
  - **Notificações:** Web Push API com Service Workers (notificações push nativas no navegador e mobile mesmo com aba fechada).
  - **Exportação:** `jspdf` / `pdfmake` para geração de PDF e parser nativo para CSV formatado.

---

## 4. Requisitos Funcionais e Não Funcionais Detalhados

### Requisitos Funcionais (RF)
- **RF-01 (Cadastro de Objetivos):** Permitir criar objetivos com título (obrigatório), descrição detalhada, prazo (data/hora), prioridade e status inicial (`A Fazer`, `Em Progresso`, `Concluído`).
- **RF-02 (Gestão e Visualização):** Dashboard com visualização em Kanban e Lista, com barra de progresso geral e filtros por prazo/status.
- **RF-03 (Edição e Exclusão):** Permitir atualizar todos os campos do objetivo e excluí-lo com confirmação para evitar perdas acidentais.
- **RF-04 (Cronômetro Pomodoro Vinculado):** Temporizador com contagem regressiva (25m foco / 5m intervalo curto / 15m longo), vinculado diretamente ao objetivo selecionado, acumulando minutos estudados no card correspondente.
- **RF-05 (Temporizador em Segundo Plano):** Timer executado via Web Worker / timestamps absolutos para não sofrer atrasos com a aba inativa.
- **RF-06 (Sistema de Gamificação):**
  - Concessão de XP (+10 XP por minuto de foco completado; +50 XP ao finalizar um objetivo).
  - Níveis de usuário calculados exponencialmente.
  - Contador de *Streak* diário (dias consecutivos com pelo menos 1 ciclo Pomodoro concluído).
  - Badges desbloqueáveis (ex: "Primeiro Round", "Foco de Ferro - 4 ciclos", "Madrugador").
- **RF-07 (Autenticação e Multi-dispositivo):** Login por email/senha ou OAuth (Google), sincronizando o estado dos objetivos e progresso entre celular e computador.
- **RF-08 (Modo Offline e Sincronização):** Funcionamento integral offline; as ações são gravadas localmente e enviadas à nuvem via fila de reconciliação assim que a conexão for restabelecida.
- **RF-09 (Criptografia E2EE):** As descrições e anotações pessoais do objetivo são criptografadas no navegador com chave derivada da senha do usuário antes do envio ao backend.
- **RF-10 (Notificações Push e Lembretes):** Disparo de notificações push programadas para alertar o início de pausas, término de rounds e lembretes de metas próximas do vencimento.
- **RF-11 (Modo Escuro Personalizável):** Alternância entre tema Claro, Escuro e Alto Contraste, com persistência da preferência do usuário.
- **RF-12 (Estatísticas e Gráficos):** Gráfico de barras de tempo focado por dia da semana, gráfico de pizza de distribuição por status e histórico de ciclos concluídos.
- **RF-13 (Exportação de Dados):** Botão para download de relatórios em CSV (para planilhas) e PDF diagramado com sumário de desempenho.

### Requisitos Não Funcionais (RNF)
- **RNF-01 (Performance & Latência):** Tempo de inicialização (First Contentful Paint) < 1.2 segundos; resposta das ações de clique < 100ms.
- **RNF-02 (Confiabilidade do Cronômetro):** Margem de erro do temporizador inferior a 0.1% em qualquer condição de segundo plano.
- **RNF-03 (Segurança e Privacidade):** Chaves AES-256 geradas no cliente; nenhum texto em claro de anotações confidenciais deve transitar ou ser armazenado no banco desprotegido.
- **RNF-04 (Disponibilidade e Resiliência):** Aplicação acessível 99.9% do tempo através de arquitetura resiliente e suporte PWA offline-first.
- **RNF-05 (Acessibilidade):** Conformidade com WCAG 2.1 nível AA (contraste mínimo de 4.5:1, navegação por teclado e rótulos ARIA para leitores de tela).
- **RNF-06 (Responsividade):** Layout fluido adaptável a telas de 320px (smartphones compactos) até 4K (monitores ultrawide).

---

## 5. Critérios de Teste e Métricas de Sucesso

### Critérios de Teste e Validação (BDD / Cenários de Teste)
1. **Cenário Pomodoro + Recompensa:**
   - *Dado* que o usuário iniciou um Pomodoro de 25 minutos vinculado ao objetivo "Biologia Celular",
   - *Quando* o cronômetro atinge 00:00,
   - *Então* o sistema dispara som de conclusão, emite notificação push, credita 250 XP na conta do usuário, incrementa o tempo estudado na tarefa e sugere a pausa de 5 minutos.
2. **Cenário Modo Offline e Sincronização:**
   - *Dado* que o usuário está sem conexão com a internet,
   - *Quando* ele cria um novo objetivo e conclui um ciclo de foco,
   - *Então* a interface salva tudo no IndexedDB e exibe indicador de "Alterações salvas localmente";
   - *E quando* a conexão retorna, a sincronização é executada sem duplicar nem sobrescrever dados indevidamente.
3. **Cenário Persistência e Dark Mode:**
   - *Dado* que o usuário ativou o tema escuro e recarregou a página (F5),
   - *Então* a aplicação deve renderizar instantaneamente no tema escuro sem efeito "flash" de tela branca.

### Métricas de Sucesso do Produto (KPIs)
- **Taxa de Conclusão do Primeiro Ciclo (Activation Rate):** % de novos usuários que concluem pelo menos 1 Pomodoro de 25 minutos nas primeiras 24 horas (Meta: > 60%).
- **Retenção D1, D7 e D14:** Frequência de retorno diário impulsionada pelo mecanismo de streaks (Meta: Retenção D7 > 35%).
- **Volume de Foco Líquido Semanal:** Média de horas de estudo concentrado por usuário ativo por semana (Meta: >= 5 horas semanais).
- **Taxa de Conversão de Metas:** Percentual de objetivos cadastrados que atingem o status `Concluído` (Meta: > 50%).
- **SUS (System Usability Scale):** Índice de usabilidade medido com os primeiros 30 testadores (Meta: Score SUS >= 82 - Excelente).
