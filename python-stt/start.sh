#!/bin/bash
# Script para iniciar o serviço de STT

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RPG Session STT Service ===${NC}"

# Verifica se está no diretório correto
if [ ! -f "app.py" ]; then
    echo -e "${RED}Erro: Execute este script no diretório python-stt${NC}"
    exit 1
fi

# Verifica se o venv existe
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Criando ambiente virtual...${NC}"
    python3 -m venv venv
fi

# Ativa o venv
source venv/bin/activate

# Instala dependências se necessário
if [ ! -f "venv/.installed" ]; then
    echo -e "${YELLOW}Instalando dependências...${NC}"
    pip install --upgrade pip
    pip install -r requirements.txt
    touch venv/.installed
fi

# Variáveis de ambiente (pode customizar)
export WHISPER_MODEL="${WHISPER_MODEL:-base}"
export WHISPER_LANGUAGE="${WHISPER_LANGUAGE:-pt}"

echo -e "${GREEN}Modelo: ${WHISPER_MODEL}${NC}"
echo -e "${GREEN}Idioma: ${WHISPER_LANGUAGE}${NC}"
echo ""

# Inicia o servidor
echo -e "${GREEN}Iniciando servidor em http://127.0.0.1:8765${NC}"
echo -e "${YELLOW}Pressione Ctrl+C para encerrar${NC}"
echo ""

uvicorn app:app --host 127.0.0.1 --port 8765 --reload
