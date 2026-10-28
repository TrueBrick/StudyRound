import React, { useState, useRef } from 'react';
import { 
  X, 
  Mic, 
  Square, 
  Upload, 
  FileAudio, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  Plus, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { audioService } from '../services/audioService';

interface AudioTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGoalWithText: (text: string) => void;
  onSummarizeText: (text: string) => void;
}

export const AudioTranscriberModal: React.FC<AudioTranscriberModalProps> = ({
  isOpen,
  onClose,
  onCreateGoalWithText,
  onSummarizeText,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Iniciar Gravação pelo Microfone
  const startRecording = async () => {
    setError(null);
    setCopied(false);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await processAudioBlob(audioBlob, 'audio/webm');
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      audioService.playClick();

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      setError('Permissão para uso do microfone negada ou indisponível.');
    }
  };

  // Parar gravação
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audioService.playClick();
    }
  };

  // Processar Blob de áudio e enviar para Gemini 3.5 Transcribe
  const processAudioBlob = async (blob: Blob, mimeType: string) => {
    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Audio,
            mimeType,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Falha ao transcrever o áudio');
        }

        setTranscription(data.transcription || '');
        audioService.playTaskSuccess();
        setLoading(false);
      };

      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error('Erro na transcrição:', err);
      setError(err.message || 'Erro ao processar áudio com Gemini 3.5 Transcribe.');
      setLoading(false);
    }
  };

  // Upload de arquivo de áudio
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    audioService.playClick();
    processAudioBlob(file, file.type || 'audio/mp3');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    audioService.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-violet-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                  Transcrever Áudio & Ditado de Aulas
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300">
                  gemini-3.5-transcribe
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Grave anotações por voz ou envie gravações de aulas para transcrição precisa
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-6 overflow-y-auto space-y-5">

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Área de Gravação / Envio de Arquivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Bloco Gravador de Voz */}
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 text-center flex flex-col items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Gravação ao Vivo pelo Microfone
              </span>

              <div className="my-4 flex flex-col items-center">
                {isRecording ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-rose-500 text-white flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/30">
                      <Mic className="w-7 h-7" />
                    </div>
                    <span className="text-base font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {formatTimer(recordingSeconds)}
                    </span>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                    <Mic className="w-6 h-6" />
                  </div>
                )}
              </div>

              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Finalizar e Transcrever</span>
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Iniciar Gravação de Voz</span>
                </button>
              )}
            </div>

            {/* Bloco Envio de Arquivo de Áudio */}
            <div className="p-5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 text-center flex flex-col items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Enviar Arquivo Gravado (.mp3, .wav, .m4a)
              </span>

              <div className="my-4 w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <FileAudio className="w-6 h-6" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || isRecording}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-bold transition disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher Arquivo de Áudio</span>
              </button>
            </div>

          </div>

          {/* Feedback de Carregamento */}
          {loading && (
            <div className="p-6 rounded-2xl bg-violet-50/50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-violet-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-violet-900 dark:text-violet-200">
                Gemini 3.5 Transcribe processando seu áudio...
              </p>
              <p className="text-[11px] text-stone-500">
                Identificando palavras, aplicando pontuação gramatical e gerando o texto transcrito.
              </p>
            </div>
          )}

          {/* Resultado da Transcrição */}
          {transcription && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>Texto Transcrito com Sucesso</span>
                </h3>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="w-full p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-violet-500/30"
              />

              {/* Ações com o Texto Transcrito */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    audioService.playClick();
                    onCreateGoalWithText(transcription);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Objetivo com este Texto</span>
                </button>

                <button
                  onClick={() => {
                    audioService.playClick();
                    onSummarizeText(transcription);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Gerar Resumo ou Flashcards</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 text-xs font-bold transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
