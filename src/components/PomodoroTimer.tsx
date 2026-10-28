import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Sparkles, 
  Check, 
  Maximize2,
  Minimize2,
  X,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyGoal } from '../types/study';
import { audioService } from '../services/audioService';
import { notificationService } from '../services/notificationService';

interface PomodoroTimerProps {
  activeGoal: StudyGoal | null;
  onClearActiveGoal: () => void;
  onSessionComplete: (durationMinutes: number, mode: 'focus' | 'short_break' | 'long_break', goalId?: string) => void;
}

type TimerMode = 'focus' | 'short_break' | 'long_break';

const MODE_CONFIG = {
  focus: { name: 'Foco Pleno', minutes: 25, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' },
  short_break: { name: 'Pausa Curta', minutes: 5, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' },
  long_break: { name: 'Pausa Longa', minutes: 15, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500' },
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  activeGoal,
  onClearActiveGoal,
  onSessionComplete,
}) => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(MODE_CONFIG.focus.minutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [ambientSoundActive, setAmbientSoundActive] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  const totalTimeForMode = MODE_CONFIG[mode].minutes * 60;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Troca de modo
  const changeMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_CONFIG[newMode].minutes * 60);
  };

  // Efeito do relógio
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, activeGoal]);

  // Completou ciclo
  const handleComplete = () => {
    setIsRunning(false);
    audioService.playChime();

    // Notificação Push
    notificationService.notifyPomodoroComplete(mode, activeGoal?.title);

    // Celebração de confetes se for foco
    if (mode === 'focus') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });
    }

    // Registrar no armazenamento
    onSessionComplete(MODE_CONFIG[mode].minutes, mode, activeGoal?.id);

    // Sugerir próximo modo
    if (mode === 'focus') {
      changeMode('short_break');
    } else {
      changeMode('focus');
    }
  };

  const toggleTimer = () => {
    audioService.playClick();
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    audioService.playClick();
    setIsRunning(false);
    setTimeLeft(MODE_CONFIG[mode].minutes * 60);
  };

  const skipTimer = () => {
    audioService.playClick();
    setIsRunning(false);
    if (mode === 'focus') changeMode('short_break');
    else changeMode('focus');
  };

  const toggleAmbient = () => {
    const newState = audioService.toggleAmbientCozyNoise();
    setAmbientSoundActive(newState);
  };

  // Formatação MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Atualizar título da aba do navegador para o estudante acompanhar de longe
  useEffect(() => {
    if (isRunning) {
      document.title = `(${timeFormatted}) ${MODE_CONFIG[mode].name} • StudyRound`;
    } else {
      document.title = 'StudyRound - Plataforma Gamificada de Estudos e Foco';
    }
  }, [timeFormatted, isRunning, mode]);

  // Porcentagem circular
  const progressPercent = ((totalTimeForMode - timeLeft) / totalTimeForMode) * 100;
  const strokeDashoffset = 440 - (440 * progressPercent) / 100;

  return (
    <div className={`relative rounded-3xl p-6 transition-all duration-300 border
      ${isZenMode 
        ? 'fixed inset-4 z-50 flex flex-col items-center justify-center bg-stone-900 text-white shadow-2xl' 
        : 'bg-white/90 dark:bg-stone-800/90 border-amber-900/10 dark:border-stone-700/80 shadow-md backdrop-blur-xs'
      }`}
    >
      {/* Botões do topo do timer: Som ambiente & Zen Mode */}
      <div className="w-full flex items-center justify-between mb-4">
        
        {/* Indicador do Objetivo Vinculado */}
        <div className="flex-1 min-w-0 mr-2">
          {activeGoal ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300/60 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs font-semibold max-w-full">
              <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">Focando em: {activeGoal.title}</span>
              <button 
                onClick={onClearActiveGoal} 
                className="hover:text-amber-700 ml-1 p-0.5 rounded-full hover:bg-amber-200/60 dark:hover:bg-amber-900"
                title="Desvincular e focar livremente"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Sessão de Foco Livre
            </span>
          )}
        </div>

        {/* Controles de Som & Zen */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleAmbient}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
              ambientSoundActive 
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/50' 
                : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700/50'
            }`}
            title="Som ambiente de chuva suave e aconchegante"
          >
            <CloudRain className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">{ambientSoundActive ? 'Chuva Ativa' : 'Som Ambiente'}</span>
          </button>

          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition"
            title={isZenMode ? 'Sair do Modo Zen' : 'Modo Zen Tela Cheia'}
          >
            {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Seletores de Modo (Foco, Pausa Curta, Pausa Longa) */}
      <div className="flex items-center justify-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-900/60 rounded-2xl max-w-xs mx-auto mb-6">
        <button
          onClick={() => changeMode('focus')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition ${
            mode === 'focus'
              ? 'bg-white dark:bg-stone-800 text-amber-700 dark:text-amber-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          Foco (25m)
        </button>
        <button
          onClick={() => changeMode('short_break')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition ${
            mode === 'short_break'
              ? 'bg-white dark:bg-stone-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          Pausa (5m)
        </button>
        <button
          onClick={() => changeMode('long_break')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition ${
            mode === 'long_break'
              ? 'bg-white dark:bg-stone-800 text-blue-700 dark:text-blue-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          Longa (15m)
        </button>
      </div>

      {/* Relógio Circular Aconchegante */}
      <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {/* Círculo de fundo */}
          <circle
            cx="80"
            cy="80"
            r="70"
            className="stroke-stone-200 dark:stroke-stone-700"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Círculo de progresso */}
          <circle
            cx="80"
            cy="80"
            r="70"
            className={`transition-all duration-500 ${
              mode === 'focus' 
                ? 'stroke-amber-500' 
                : mode === 'short_break' 
                  ? 'stroke-emerald-500' 
                  : 'stroke-blue-500'
            }`}
            strokeWidth="8"
            strokeDasharray="440"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Contador Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-5xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-mono">
            {timeFormatted}
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider mt-1 ${MODE_CONFIG[mode].color}`}>
            {MODE_CONFIG[mode].name}
          </span>
          <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
            {isRunning ? 'Em andamento' : 'Pausado'}
          </span>
        </div>
      </div>

      {/* Botões de Ação do Temporizador */}
      <div className="flex items-center justify-center gap-3 mt-6">
        
        {/* Reiniciar */}
        <button
          onClick={resetTimer}
          className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition active:scale-95"
          title="Reiniciar tempo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Iniciar / Pausar Principal */}
        <button
          onClick={toggleTimer}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-base shadow-md transition active:scale-95 ${
            mode === 'focus' 
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' 
              : mode === 'short_break' 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current ml-0.5" />
              <span>Iniciar</span>
            </>
          )}
        </button>

        {/* Pular / Próximo */}
        <button
          onClick={skipTimer}
          className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600 transition active:scale-95"
          title="Pular para próximo intervalo"
        >
          <SkipForward className="w-4 h-4" />
        </button>

      </div>

      {/* Recompensa prevista */}
      <div className="mt-5 text-center">
        <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
          {mode === 'focus' 
            ? '🏆 Esta sessão rende +250 XP e +5 StudyCoins' 
            : '☕ Pausas regulares restauram a clareza mental e a memória'}
        </span>
      </div>

    </div>
  );
};
