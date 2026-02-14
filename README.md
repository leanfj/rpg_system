# RPG Session Support

Sistema de suporte para mesas de RPG com transcrição de áudio em tempo real e ferramentas para mestres.

## 🎯 Funcionalidades

### Gravação e Transcrição
- **Gravação de Sessões**: Capture áudio das suas sessões de RPG
- **Transcrição em Tempo Real**: Whisper converte fala em texto automaticamente
- **Organização por Campanhas**: Agrupe sessões em campanhas
- **Persistência Local**: Todos os dados ficam localmente em SQLite

### Dashboard do Mestre
- **Personagens Jogadores**: Cadastro completo de PCs com atributos D&D 5e 2024
- **NPCs**: Gerenciamento de personagens não-jogadores com tags e localização
- **Quests**: Controle de missões e objetivos da campanha
- **Anotações do Mestre**: Área para notas privadas

### Tracker de Combate
- **Ordem de Iniciativa**: Lista ordenada automaticamente por valor
- **Controle de Turnos**: Navegue facilmente entre os participantes
- **Destaque Visual**: Quem está agindo fica em evidência
- **Controle de PV**: Ajuste pontos de vida diretamente no tracker
- **Suporte a Jogadores e Monstros**: Diferenciação visual por tipo

### Bestiário SRD
- **330+ Monstros**: Base de dados completa do SRD 5e
- **Popups de Estatísticas**: Visualize dados completos com um clique
- **Badges de Modificadores**: Exibe bônus de habilidade em destaque
- **Integração com Iniciativa**: Adicione criaturas ao combate facilmente
- **Traduções PT-BR**: Termos traduzidos para português

### Monitoramento de Turnos
- **Períodos do Dia**: Controle de tempo por manhã/tarde/noite/madrugada
- **Ordem de Marcha e Vigia**: Campos para organização do grupo
- **Ações de Dungeon**: Checklist de ações comuns
- **Tabelas de Encontro**: Gerador por ambiente e dificuldade
- **Controle de PV de Criaturas**: Rastreie múltiplos monstros

### Ambiência Sonora
- **Categorias de Música**: Combate, viagem, taverna, suspense, exploração, cidade
- **Modo Automático**: Troca de música baseada em palavras-chave
- **Controle de Volume**: Ajuste fino de intensidade
- **Upload de Trilhas**: Adicione suas próprias músicas

### Ferramentas
- **Rolador de Dados 3D**: Dados com física realista
- **Rolador Avançado**: Notação completa (ex: 2d20kh1+5)
- **Checklist de Sessão**: Lista de preparação pré-jogo

## 🏗️ Arquitetura

```
rpg_system/
├── electron/          # Processo principal (Node.js)
│   ├── main.ts        # Entry point do Electron
│   ├── preload.ts     # Bridge seguro para o renderer
│   ├── ipc/           # Handlers de comunicação
│   └── services/      # Serviços (audio, database)
│
├── renderer/          # Interface (React)
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── styles/
│       └── types/
│
├── core/              # Lógica de domínio (DDD)
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── python-stt/        # Serviço de transcrição (Python)
│   ├── app.py         # Servidor FastAPI + WebSocket
│   └── whisper_service.py
│
└── database/
    └── schema.prisma  # Modelo de dados
```

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- Python 3.10+
- FFmpeg (para processamento de áudio)

### Instalação

1. **Clone e instale dependências Node:**
```bash
npm install
```

2. **Configure o banco de dados:**
```bash
npm run db:migrate
```

3. **Configure o serviço Python:**
```bash
cd python-stt
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Executando

1. **Inicie o serviço de transcrição (em um terminal):**
```bash
cd python-stt
./start.sh
# ou: python app.py
```

2. **Inicie o app Electron (em outro terminal):**
```bash
npm run dev
```

## 📊 Modelo de Dados

- **Campaign**: Agrupa sessões (ex: "A Maldição de Strahd")
- **Session**: Uma partida gravada
- **TranscriptChunk**: Pedaços de texto transcritos
- **Event**: Eventos detectados (combate, crítico, etc)
- **PlayerCharacter**: Personagens jogadores com ficha completa D&D 5e
- **NPC**: Personagens não-jogadores com tags e localização
- **Quest**: Missões e objetivos da campanha
- **MasterNote**: Anotações privadas do mestre
- **TurnMonitor**: Dados de monitoramento de turnos por campanha

## 🔧 Configuração do Whisper

O modelo padrão é `base`. Você pode alterar via variável de ambiente:

```bash
# Modelos disponíveis: tiny, base, small, medium, large
export WHISPER_MODEL=small
```

| Modelo | Parâmetros | RAM | Qualidade |
|--------|------------|-----|-----------|
| tiny   | ~39M       | ~1GB | ⭐⭐ |
| base   | ~74M       | ~1GB | ⭐⭐⭐ |
| small  | ~244M      | ~2GB | ⭐⭐⭐⭐ |
| medium | ~769M      | ~5GB | ⭐⭐⭐⭐⭐ |
| large  | ~1550M     | ~10GB | ⭐⭐⭐⭐⭐ |

## 📝 Scripts Disponíveis

```bash
npm run dev           # Inicia em modo desenvolvimento
npm run build         # Compila para produção
npm run db:migrate    # Aplica migrações do banco
npm run db:studio     # Abre Prisma Studio (GUI do banco)
npm run lint          # Verifica código
```

## 🛣️ Roadmap

### Implementado ✅
- [x] Tracker de combate com ordem de iniciativa
- [x] Integração com fichas de personagem
- [x] Bestiário SRD completo com traduções
- [x] Sistema de ambiência sonora
- [x] Monitoramento de turnos e tempo
- [x] Gerenciamento de NPCs e Quests

### Próximos Passos
- [ ] Detecção automática de eventos (combate, crítico)
- [ ] Exportação de sessões (PDF, Markdown)
- [ ] Reconhecimento de NPCs por voz
- [ ] Modo offline completo
- [ ] Mapas interativos com tokens
- [ ] Sincronização entre dispositivos

## 📄 Licença

MIT
