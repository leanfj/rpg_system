"""
Serviço de transcrição usando OpenAI Whisper.
Carrega o modelo uma vez e processa múltiplos áudios.
"""

import whisper
import numpy as np
import tempfile
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class WhisperService:
    """
    Serviço singleton para transcrição de áudio.
    O modelo é carregado na inicialização para evitar overhead.
    """
    
    def __init__(self, model_name: str = "base"):
        """
        Inicializa o serviço com o modelo especificado.
        
        Modelos disponíveis (em ordem de tamanho/precisão):
        - tiny: ~39M parâmetros, ~1GB RAM
        - base: ~74M parâmetros, ~1GB RAM  
        - small: ~244M parâmetros, ~2GB RAM
        - medium: ~769M parâmetros, ~5GB RAM
        - large: ~1550M parâmetros, ~10GB RAM
        
        Para uso local, 'base' oferece bom equilíbrio.
        """
        logger.info(f"Carregando modelo Whisper: {model_name}")
        self.model = whisper.load_model(model_name)
        self.model_name = model_name
        logger.info(f"Modelo {model_name} carregado com sucesso!")
    
    def transcribe_audio(
        self, 
        audio_data: np.ndarray, 
        sample_rate: int = 16000,
        language: str = "pt"
    ) -> dict:
        """
        Transcreve um array de áudio.
        
        Args:
            audio_data: Array numpy com os dados de áudio (float32, mono)
            sample_rate: Taxa de amostragem (Whisper espera 16kHz)
            language: Código do idioma ("pt" para português)
            
        Returns:
            Dict com:
            - text: Texto transcrito
            - language: Idioma detectado
            - segments: Lista de segmentos com timestamps
        """
        # Whisper espera áudio em 16kHz
        if sample_rate != 16000:
            # Resample se necessário (simplificado)
            logger.warning(f"Sample rate {sample_rate}Hz detectado. Whisper espera 16kHz.")
        
        # Garante que é float32 e normalizado
        audio_data = audio_data.astype(np.float32)
        if audio_data.max() > 1.0:
            audio_data = audio_data / 32768.0  # Normaliza de int16
        
        # Transcreve
        result = self.model.transcribe(
            audio_data,
            language=language,
            task="transcribe",
            fp16=False,  # Desabilita FP16 para compatibilidade
            verbose=False
        )
        
        return {
            "text": result["text"].strip(),
            "language": result.get("language", language),
            "segments": [
                {
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": seg["text"].strip()
                }
                for seg in result.get("segments", [])
            ]
        }
    
    def transcribe_file(self, file_path: str, language: str = "pt") -> dict:
        """
        Transcreve um arquivo de áudio diretamente.
        
        Args:
            file_path: Caminho para o arquivo de áudio
            language: Código do idioma
            
        Returns:
            Dict com texto e segmentos
        """
        result = self.model.transcribe(
            file_path,
            language=language,
            task="transcribe",
            fp16=False,
            verbose=False
        )
        
        return {
            "text": result["text"].strip(),
            "language": result.get("language", language),
            "segments": [
                {
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": seg["text"].strip()
                }
                for seg in result.get("segments", [])
            ]
        }
    
    def transcribe_bytes(
        self, 
        audio_bytes: bytes, 
        sample_rate: int = 16000,
        language: str = "pt"
    ) -> dict:
        """
        Transcreve bytes de áudio (PCM raw ou WAV).
        
        Args:
            audio_bytes: Bytes do áudio
            sample_rate: Taxa de amostragem
            language: Código do idioma
            
        Returns:
            Dict com texto e segmentos
        """
        # Converte bytes para numpy array
        audio_data = np.frombuffer(audio_bytes, dtype=np.int16)
        audio_data = audio_data.astype(np.float32) / 32768.0
        
        return self.transcribe_audio(audio_data, sample_rate, language)


# Singleton global
_service: Optional[WhisperService] = None


def get_whisper_service(model_name: str = "base") -> WhisperService:
    """Retorna a instância singleton do serviço Whisper."""
    global _service
    if _service is None:
        _service = WhisperService(model_name)
    return _service
