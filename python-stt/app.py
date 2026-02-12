"""
Servidor de transcrição de áudio usando FastAPI e Whisper.

Execução:
    uvicorn app:app --host 127.0.0.1 --port 8765 --reload

Endpoints:
    - GET  /health         -> Status do servidor
    - GET  /model          -> Info do modelo carregado
    - WS   /transcribe     -> WebSocket para streaming de áudio
    - POST /transcribe     -> Transcrição de arquivo único
"""

import asyncio
import json
import logging
import os
import tempfile
from typing import Optional

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from whisper_service import get_whisper_service, WhisperService

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configuração do app
app = FastAPI(
    title="RPG Session STT Service",
    description="Serviço de Speech-to-Text para transcrição de sessões de RPG",
    version="0.1.0"
)

# CORS para permitir conexões do Electron
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, restringir para localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração
MODEL_NAME = os.getenv("WHISPER_MODEL", "base")
LANGUAGE = os.getenv("WHISPER_LANGUAGE", "pt")
SAMPLE_RATE = 16000

# Serviço Whisper (lazy loading)
whisper_service: Optional[WhisperService] = None


def get_service() -> WhisperService:
    """Retorna o serviço Whisper, inicializando se necessário."""
    global whisper_service
    if whisper_service is None:
        logger.info("Inicializando serviço Whisper...")
        whisper_service = get_whisper_service(MODEL_NAME)
    return whisper_service


@app.on_event("startup")
async def startup_event():
    """Carrega o modelo na inicialização do servidor."""
    logger.info("=== RPG Session STT Service ===")
    logger.info(f"Modelo: {MODEL_NAME}")
    logger.info(f"Idioma padrão: {LANGUAGE}")
    # Pré-carrega o modelo
    get_service()
    logger.info("Servidor pronto para receber conexões!")


@app.get("/health")
async def health_check():
    """Verifica se o servidor está funcionando."""
    return {"status": "healthy", "model": MODEL_NAME}


@app.get("/model")
async def model_info():
    """Retorna informações sobre o modelo carregado."""
    service = get_service()
    return {
        "model_name": service.model_name,
        "language": LANGUAGE,
        "sample_rate": SAMPLE_RATE
    }


@app.post("/transcribe")
async def transcribe_file(file: UploadFile = File(...), language: str = LANGUAGE):
    """
    Transcreve um arquivo de áudio enviado via POST.
    
    Aceita: WAV, MP3, M4A, etc.
    """
    try:
        service = get_service()
        
        # Salva arquivo temporário
        suffix = os.path.splitext(file.filename)[1] if file.filename else ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        try:
            result = service.transcribe_file(tmp_path, language)
            return JSONResponse(content=result)
        finally:
            os.unlink(tmp_path)
            
    except Exception as e:
        logger.error(f"Erro na transcrição: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.websocket("/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    """
    WebSocket para transcrição em tempo real.
    
    Protocolo:
    1. Cliente conecta
    2. Cliente envia mensagem JSON: {"type": "config", "language": "pt", "format": "webm"}
    3. Cliente envia chunks de áudio como bytes
    4. Servidor responde com: {"type": "transcript", "text": "...", "timestamp": 123}
    5. Cliente envia: {"type": "end"} para encerrar
    
    Alternativa simplificada:
    - Cliente envia apenas bytes de áudio
    - Servidor responde com texto a cada chunk processado
    """
    await websocket.accept()
    logger.info("Nova conexão WebSocket estabelecida")
    
    service = get_service()
    language = LANGUAGE
    input_format = "pcm16"
    session_start_time = asyncio.get_event_loop().time()
    audio_buffer = bytearray()
    chunk_duration_seconds = 5  # Processa a cada N segundos de áudio
    bytes_per_second = SAMPLE_RATE * 2  # 16-bit = 2 bytes por sample
    chunk_size = chunk_duration_seconds * bytes_per_second
    
    try:
        while True:
            # Recebe dados
            data = await websocket.receive()
            
            # Mensagem de texto (configuração ou comando)
            if "text" in data:
                try:
                    message = json.loads(data["text"])
                    msg_type = message.get("type")
                    
                    if msg_type == "config":
                        language = message.get("language", LANGUAGE)
                        input_format = message.get("format", "pcm16")
                        logger.info(
                            f"Configuração recebida: language={language}, format={input_format}"
                        )
                        await websocket.send_json({
                            "type": "config_ack",
                            "language": language,
                            "format": input_format
                        })
                        
                    elif msg_type == "end":
                        # Processa buffer restante antes de encerrar
                        if len(audio_buffer) > 0:
                            result = await process_audio_chunk(
                                service, bytes(audio_buffer), language, session_start_time
                            )
                            if result["text"]:
                                await websocket.send_json(result)
                        
                        logger.info("Sessão encerrada pelo cliente")
                        break
                        
                except json.JSONDecodeError:
                    logger.warning("Mensagem de texto inválida recebida")
            
            # Dados de áudio (bytes)
            elif "bytes" in data:
                if input_format == "webm":
                    result = await process_audio_chunk(
                        service, data["bytes"], language, session_start_time, input_format
                    )
                    if result["text"]:
                        await websocket.send_json(result)
                        logger.info(f"Transcrição enviada: {result['text'][:50]}...")
                else:
                    audio_buffer.extend(data["bytes"])
                    
                    # Processa quando acumular áudio suficiente
                    while len(audio_buffer) >= chunk_size:
                        chunk = bytes(audio_buffer[:chunk_size])
                        audio_buffer = audio_buffer[chunk_size:]
                        
                        result = await process_audio_chunk(
                            service, chunk, language, session_start_time, input_format
                        )
                        
                        if result["text"]:
                            await websocket.send_json(result)
                            logger.info(f"Transcrição enviada: {result['text'][:50]}...")
                    
    except WebSocketDisconnect:
        logger.info("Cliente desconectado")
    except Exception as e:
        logger.error(f"Erro no WebSocket: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        logger.info("Conexão WebSocket encerrada")


async def process_audio_chunk(
    service: WhisperService,
    audio_bytes: bytes,
    language: str,
    session_start: float,
    input_format: str
) -> dict:
    """
    Processa um chunk de áudio e retorna a transcrição.
    
    Executa em thread separada para não bloquear o event loop.
    """
    loop = asyncio.get_event_loop()
    
    def do_transcribe():
        if input_format == "webm":
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
            try:
                return service.transcribe_file(tmp_path, language)
            finally:
                os.unlink(tmp_path)
        return service.transcribe_bytes(audio_bytes, SAMPLE_RATE, language)
    
    # Executa transcrição em thread pool
    result = await loop.run_in_executor(None, do_transcribe)
    
    # Calcula timestamp relativo à sessão
    current_time = loop.time()
    timestamp_ms = int((current_time - session_start) * 1000)
    
    return {
        "type": "transcript",
        "text": result["text"],
        "timestamp": timestamp_ms,
        "segments": result.get("segments", [])
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8765,
        reload=True,
        log_level="info"
    )
