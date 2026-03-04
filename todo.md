# FINANÇAS - Todo List

## Banco de Dados / Schema
- [x] Tabela de categorias (padrão + personalizadas por usuário)
- [x] Tabela de transações (entradas e saídas com todos os campos)
- [x] Tabela de parcelas (para transações de crédito parceladas)
- [x] Tabela de investimentos
- [x] Tabela de metas de investimento
- [x] Tabela de configurações do usuário (limites de alerta, parceiro vinculado)
- [x] Tabela de família/grupo (para vincular usuários - você e esposa)

## Backend (tRPC Routers)
- [x] Router de categorias: listar, criar, editar, excluir
- [x] Router de transações: listar, criar, excluir, parcelamento automático
- [x] Router de dashboard: totais mensais, gráficos, saldo, fixo vs variável
- [x] Router de visão consolidada: somar dados de todos os membros da família
- [x] Router de investimentos: CRUD completo
- [x] Router de metas: criar, atualizar progresso
- [x] Router de insights LLM: análise automática do comportamento financeiro
- [x] Router de configurações: alertas, limites
- [x] Router de família: criar grupo, convidar, aceitar convite
- [ ] Router de exportação PDF (exportação CSV implementada no frontend)
- [ ] Router de notificações por email (notificação via owner implementada)

## Frontend - Design System
- [x] Configurar tema escuro elegante com paleta de cores financeira
- [x] Configurar fontes (Inter + Plus Jakarta Sans)
- [x] Configurar AppLayout com sidebar responsiva
- [x] Criar componentes reutilizáveis (cards, badges, formatadores de moeda)

## Frontend - Páginas
- [x] Página de login/landing
- [x] Dashboard principal (visão mensal)
- [x] Página de transações (listagem + filtros)
- [x] Modal/formulário de nova transação com parcelamento
- [x] Página de categorias (gestão com cores)
- [x] Página de investimentos com metas
- [x] Página de relatórios e exportação CSV
- [x] Página de configurações (alertas, limites, renda estimada)
- [x] Visão consolidada do casal (tab Família no Dashboard)
- [x] Página de Família (criação de grupo, convites)
- [x] Página JoinFamily (aceitar convites)

## Frontend - Gráficos e Visualizações
- [x] Gráfico de pizza por categoria
- [x] Gráfico de barras por tipo de gasto
- [x] Gráfico de evolução de saldo ao longo do mês (área)
- [x] Gráfico de alocação de investimentos
- [x] Indicador de progresso de meta de investimento
- [x] Comparativo fixos vs variáveis

## Funcionalidades Avançadas
- [x] Parcelamento automático (gerar parcelas futuras para crédito)
- [x] Navegação entre meses (passado e futuro)
- [x] Análise textual automática com LLM
- [x] Alertas visuais quando gastos ultrapassarem limites
- [x] Exportação CSV de relatório mensal
- [x] PWA: manifest.json configurado
- [x] Indicadores inteligentes (categoria que mais consome, % comprometido da renda)

## Testes
- [x] Testes de routers de autenticação (3 testes)
- [x] Testes de routers de categorias (3 testes)
- [x] Testes de routers de transações (2 testes)
- [x] Testes de routers de dashboard (3 testes)
- [x] Testes de routers de investimentos (3 testes)
- [x] Testes de routers de configurações (2 testes)
- [x] Testes de routers de família (2 testes)
- [x] 19 testes passando ✓

## Funcionalidade Offline (PWA Completo)
- [x] Service Worker com cache de assets estáticos (App Shell)
- [x] Service Worker com estratégia Network-First para API e fallback para cache
- [x] IndexedDB: armazenamento local de transações, categorias, investimentos, dashboard
- [x] IndexedDB: fila de operações pendentes (sync queue) para mutations offline
- [x] Hook useOnlineStatus para detectar conectividade em tempo real
- [x] Hook useOfflineSync para gerenciar sincronização automática
- [x] Interceptação de mutations tRPC para enfileirar quando offline
- [x] Indicador visual de status de conexão na sidebar (online/offline/sincronizando)
- [x] Indicador de operações pendentes na sidebar
- [x] Sincronização automática ao recuperar conexão
- [x] Sincronização em background via Background Sync API (quando suportado)
- [x] Resolução de conflitos: server-wins para dados mais recentes
- [x] Notificação toast quando sincronização for concluída
- [x] Página de dashboard funcional 100% offline com dados em cache
- [x] Página de transações funcional offline (leitura + criação enfileirada)
- [x] Manifest.json atualizado com ícones e configurações PWA completas
- [x] Endpoint sync.batch no backend para processar fila em lote
- [x] 24 testes passando (incluindo 5 testes de sync offline)
