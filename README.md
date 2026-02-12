# RPG Session Support

Sistema de suporte para mesas de RPG com transcrição de áudio em tempo real.

## 🎯 Funcionalidades

- **Gravação de Sessões**: Capture áudio das suas sessões de RPG
- **Transcrição em Tempo Real**: Whisper converte fala em texto automaticamente
- **Organização por Campanhas**: Agrupe sessões em campanhas
- **Persistência Local**: Todos os dados ficam localmente em SQLite

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
- **NPC**: Personagens não-jogadores

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

- [ ] Detecção automática de eventos (combate, crítico)
- [ ] Exportação de sessões (PDF, Markdown)
- [ ] Reconhecimento de NPCs por voz
- [ ] Integração com fichas de personagem
- [ ] Modo offline completo

## 📄 Licença

MIT
