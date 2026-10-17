# PRD — TAVIR Fábrica (Escritório Virtual · Módulo Tavir Fábrica)

## Problem Statement (original)
Construir uma aplicação web frontend ultra-moderna e funcional para o sistema "TAVIR — Inteligência que entra em operação" (Escritório Virtual · Módulo Tavir Fábrica): engenharia de software autônoma & AI Ops, com estado reativo, simuladores de execução de agentes (GhostCLI), Completion Guard (8 regras físicas), entrevista Gate 0 (7 dimensões + SHA-256), loop de auto-correção via linter e gestão de esteiras com Gates Humanos obrigatórios. Baseado em 2 screenshots de referência e nos guias PLANO-MESTRE / GUIA-REPLICACAO.

## User choices
- Persistência real no backend (FastAPI + MongoDB).
- Priorizar fluxo principal: Dashboard + Visão geral + Pendências + Modal Gate 0 + Execução Autônoma.
- Stack original do usuário é SolidJS/Vite; ambiente Emergent usa React → implementado em React mantendo fidelidade visual/funcional.

## Architecture
- Frontend: React 19 (CRA/craco) + Tailwind + shadcn/ui, react-router, sonner, lucide-react.
- Backend: FastAPI + Motor (MongoDB). Auto-seed de 6 esteiras + 5 projetos no startup.
- Tema: dark profundo (#090D16 / #0F1623), lime neon (#A3E635), teal (#14B8A6); fontes Plus Jakarta Sans + JetBrains Mono.

## Personas
- Carlos Henrique (CEO) — operador único, aprova Gates Humanos e demandas Gate 0.

## Core requirements (static)
- 6 esteiras canônicas (LP-C, LP-M, OF-C, OF-M, SY-C, SY-M) com filtros por tipo.
- 5 projetos reais com progresso, etapas, pendências e atividade.
- Visão interna do projeto com 7 abas; Visão geral em 2 colunas (etapas / pendências / atividade).
- Gate 0 modal com 7 dimensões, validação anti-teatro e assinatura SHA-256 + scaffold.
- Execução Autônoma que avança etapas até um Gate Humano ou bloqueio técnico.
- Completion Guard & QA (8 regras + linters + Playwright/Emulator).
- Acessos (variáveis de ambiente), incluindo resolução do bloqueio SUPABASE_URL.

## Implemented (2026-06)
- [x] Dashboard: esteiras + projetos + filtros (fiel ao screenshot 1).
- [x] Project view: header operacional, 7 abas pill, StepsList, Pendencies, ActivityLog (fiel ao screenshot 2).
- [x] Gate 0 modal: 7 dimensões, anti-teatro, SHA-256, scaffold físico animado, cria projeto e navega.
- [x] Pendências: Gate Humano (AUTH, assinatura SHA-256) e bloqueio técnico de build (ERROR, cadastro SUPABASE_URL + rebuild).
- [x] Execução Autônoma (loop) + "Simular conclusão da etapa atual".
- [x] Completion Guard & QA (8 regras escaláveis por esteira), Arquivos & Workspace, Acessos, Kanban/Roadmap/Documentos.
- [x] Command Palette (Ctrl+K), Chat do projeto (drawer).
- [x] Backend endpoints + seed + reseed; testado (11/11 pytest). Bug de guard 8/8 corrigido.

## Backlog
- P1: Visualizador Markdown real de documentos (PROJECT.md etc.) com selo Banca Revisora.
- P1: Kanban com drag-and-drop e Roadmap Gantt interativo.
- P2: SSE/streaming real de logs do GhostCLI.
- P2: Autenticação multi-usuário / squads.

## Next tasks
- Enriquecer abas secundárias (Documentos markdown, Kanban DnD).
- Telemetria/Runs e Sincron Brain MCP (itens do icon rail).
