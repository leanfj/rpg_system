# AGENTS.md

## Objetivo do Projeto
Este repositório implementa um aplicativo desktop para suporte a mesas de RPG (principalmente D&D 5e), com foco em:
- gestão de campanhas, sessões, PCs, NPCs, quests, locais e eventos;
- anotações estruturadas de sessão e relatórios visuais;
- gravação/transcrição de áudio em tempo real via Whisper local;
- persistência local em SQLite (Prisma).

## Stack e Arquitetura
- `electron/`: processo principal, janela, permissões e handlers IPC.
- `renderer/`: interface React + Vite (painéis da aplicação).
- `database/`: `schema.prisma`, migrações e base SQLite.
- `python-stt/`: serviço FastAPI + WebSocket (porta `8765`) para STT.
- Build desktop com `electron-builder`.

## Fluxo Padrão de Trabalho do Agente
1. Entender o contexto antes de editar:
   - ler `README.md` e os arquivos impactados diretamente;
   - mapear impacto em dados, IPC, UI e STT.
2. Alterar de forma mínima e consistente:
   - preferir mudanças localizadas e sem refatorações paralelas desnecessárias.
3. Validar o que foi alterado:
   - rodar checks mínimos relevantes (lint/build/migração) antes de concluir.
4. Reportar resultado com objetividade:
   - o que mudou, por que mudou, riscos e validações executadas.

## Regras Obrigatórias por Tipo de Mudança

### 1) Mudanças de IPC/API entre Electron e Renderer
Sempre manter contrato sincronizado entre:
- `electron/ipc/index.ts`
- `electron/preload.ts`
- `renderer/src/types/electron.d.ts`
- hooks/componentes consumidores no `renderer/src/`

Observação: existe método com nome legado `getByCapaign` (typo). Evitar quebrar compatibilidade sem migração completa no mesmo commit.

### 2) Mudanças de Banco de Dados (Prisma/SQLite)
Se alterar modelo de dados:
- atualizar `database/schema.prisma`;
- criar/aplicar migração (`npm run db:migrate`);
- atualizar client (`npm run db:generate`, quando necessário);
- revisar queries afetadas no IPC e renderer (incluindo `include`/`orderBy`).

### 3) Mudanças de STT/Áudio
Preservar contrato atual:
- health check: `http://127.0.0.1:8765/health`
- websocket: `ws://127.0.0.1:8765/transcribe`
- protocolo de mensagens (`config`, chunks binários, `end`, retorno `transcript`).

Qualquer mudança de protocolo deve atualizar conjuntamente:
- `electron/services/audio.ts`
- `python-stt/app.py`
- hooks/consumidores de transcrição no renderer.

### 4) Mudanças de UI
- manter consistência visual com os estilos já existentes em `renderer/src/styles/` e CSS dos componentes;
- garantir comportamento em desktop e mobile;
- evitar alterar layout global sem necessidade do requisito.

## Checklist de Validação
Executar conforme impacto:
- `npm run lint`
- `npm run build:renderer`
- `npm run build:electron`
- `npm run db:migrate` (quando houver mudança de schema)

Se não executar algum item relevante, declarar explicitamente na entrega.

## Restrições e Cuidados
- não expor `ipcRenderer` diretamente no renderer; manter `contextBridge` com API explícita;
- não remover `contextIsolation`;
- não modificar arquivos de conteúdo/base (`database/5e-SRD-*.json`, `escudo_mestre_*.md`) sem pedido explícito;
- não introduzir dependências novas sem necessidade clara.

## Estado Atual de Qualidade
- não há suíte de testes automatizados dedicada no repositório;
- validação principal hoje depende de lint/build e verificação manual dos fluxos críticos.
