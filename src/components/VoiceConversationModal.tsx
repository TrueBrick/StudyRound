import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, PhoneOff, Sparkles, Volume2, Radio, AlertCircle } from 'lucide-react';
import { GeminiLiveService } from '../services/geminiLiveService';
import { audioService } from '../services/audioService';

interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
}

export const VoiceConversationModal: React.FC<VoiceConversationModalProps> = ({
  isOpen,
  onClose,
  studentName,
}) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening'>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const liveServiceRef = useRef<GeminiLiveService | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      liveServiceRef.current = new GeminiLiveService(
        (newStatus) => setStatus(newStatus),
        (err) => setErrorMessage(err)
      );
      liveServiceRef.current.connect();
    } else {
      if (liveServiceRef.current) {
        liveServiceRef.current.disconnect();
        liveServiceRef.current = null;
      }
      setStatus('disconnected');
    }

    return () => {
      if (liveServiceRef.current) {
        liveServiceRef.current.disconnect();
        liveServiceRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEndCall = () => {
    audioService.playClick();
    if (liveServiceRef.current) {
      liveServiceRef.current.disconnect();
    }
    onClose();
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'connecting':
        return 'Conectando ao Tutor de Voz...';
      case 'speaking':
        return 'Tutor respondendo...';
      case 'listening':
        return 'Ouvindo sua voz...';
      case 'connected':
        return 'Tutor pronto. Pode falar!';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-stone-900 text-stone-100 rounded-3xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col items-center justify-between p-7 sm:p-8 relative min-h-[520px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo */}
        <div className="w-full flex items-center justify-between border-b border-stone-800/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Gemini Live • Voz em Tempo Real
            </span>
          </div>

          <button
            onClick={handleEndCall}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
            title="Fechar chamada"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro se houver */}
        {errorMessage && (
          <div className="w-full my-2 p-3 bg-rose-950/60 border border-rose-800/60 rounded-2xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Centro: Orbe de Voz Animada */}
        <div className="my-auto flex flex-col items-center text-center">
          
          <div className="relative w-44 h-44 flex items-center justify-center my-4">
            
            {/* Anéis pulsantes baseados no estado */}
            <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
              status === 'speaking'
                ? 'bg-amber-500/20 scale-125 animate-ping'
                : status === 'listening'
                  ? 'bg-emerald-500/20 scale-110 animate-pulse'
                  : 'bg-stone-800/40'
            }`} />

            <div className={`absolute inset-4 rounded-full transition-all duration-500 ${
              status === 'speaking'
                ? 'bg-linear-to-tr from-amber-500/40 to-orange-500/40 blur-md'
                : status === 'listening'
                  ? 'bg-linear-to-tr from-emerald-500/40 to-teal-500/40 blur-md'
                  : 'bg-stone-800/60'
            }`} />

            {/* Núcleo Central */}
            <div className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
              status === 'speaking'
                ? 'bg-linear-to-br from-amber-500 to-orange-600 text-white scale-105 ring-4 ring-amber-400/30'
                : status === 'listening'
                  ? 'bg-linear-to-br from-emerald-500 to-teal-600 text-white scale-100 ring-4 ring-emerald-400/30'
                  : 'bg-stone-800 text-stone-300 border border-stone-700'
            }`}>
              {status === 'speaking' ? (
                <Volume2 className="w-10 h-10 animate-bounce" />
              ) : status === 'listening' ? (
                <Mic className="w-10 h-10 animate-pulse" />
              ) : (
                <Radio className="w-10 h-10 text-stone-400" />
              )}
            </div>

          </div>

          <h3 className="text-lg font-bold text-stone-100 font-serif mt-2">
            Tutor de Voz StudyRound
          </h3>
          <p className="text-xs font-semibold text-amber-400 mt-1">
            {getStatusLabel()}
          </p>
          <p className="text-[11px] text-stone-400 max-w-xs mt-2 leading-relaxed">
            Fale naturalmente no seu microfone. O Tutor responde por voz instantaneamente tirando dúvidas ou fazendo perguntas de revisão.
          </p>

          {/* Sugestões de Perguntas Orais */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-bold w-full mb-1">
              Sugestões para conversar:
            </span>
            <span className="text-[11px] bg-stone-800 text-stone-300 px-2.5 py-1 rounded-full border border-stone-700/60">
              "Me faça 3 perguntas sobre Biologia Celular"
            </span>
            <span className="text-[11px] bg-stone-800 text-stone-300 px-2.5 py-1 rounded-full border border-stone-700/60">
              "Como não procrastinar na redação?"
            </span>
            <span className="text-[11px] bg-stone-800 text-stone-300 px-2.5 py-1 rounded-full border border-stone-700/60">
              "Explique a fórmula de Bhaskara"
            </span>
          </div>

        </div>

        {/* Controles Inferiores */}
        <div className="w-full pt-4 border-t border-stone-800/80 flex items-center justify-center gap-4">
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Encerrar Conversa de Voz</span>
          </button>
        </div>

      </div>
    </div>
  );
};
