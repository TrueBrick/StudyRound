import React from 'react';
import { 
  Sparkles, 
  Flame, 
  Trophy, 
  BarChart3, 
  FileText, 
  FolderOpen, 
  Bell, 
  Sun, 
  Moon, 
  Coffee, 
  Download,
  Plus,
  Mic,
  Bot,
  FileAudio
} from 'lucide-react';
import { UserProfile } from '../types/study';
import { audioService } from '../services/audioService';

interface NavbarProps {
  profile: UserProfile;
  theme: 'cozy-light' | 'deep-dark' | 'warm-amber';
  onThemeChange: (theme: 'cozy-light' | 'deep-dark' | 'warm-amber') => void;
  onOpenNewGoal: () => void;
  onOpenGamification: () => void;
  onOpenStats: () => void;
  onOpenMaterials: () => void;
  onOpenSummaries: () => void;
  onToggleNotification: () => void;
  notificationGranted: boolean;
  onExportMenu: () => void;
  onOpenVoiceLive: () => void;
  onOpenChatbot: () => void;
  onOpenTranscribe: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  theme,
  onThemeChange,
  onOpenNewGoal,
  onOpenGamification,
  onOpenStats,
  onOpenMaterials,
  onOpenSummaries,
  onToggleNotification,
  notificationGranted,
  onExportMenu,
  onOpenVoiceLive,
  onOpenChatbot,
  onOpenTranscribe,
}) => {
  const xpNeeded = profile.level * 150;
  const progressPercent = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));

  const cycleTheme = () => {
    audioService.playClick();
    if (theme === 'cozy-light') onThemeChange('warm-amber');
    else if (theme === 'warm-amber') onThemeChange('deep-dark');
    else onThemeChange('cozy-light');
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md border-b transition-colors duration-200
      bg-white/80 dark:bg-stone-900/85 border-amber-900/10 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Marca & Logo Acolhedora */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-800 dark:text-amber-400 flex items-center justify-center font-bold text-xl shadow-xs border border-amber-500/20">
            <span>{profile.avatarIcon || '☕'}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-stone-800 dark:text-stone-100 font-serif">
                Study<span className="text-amber-600 dark:text-amber-400">Round</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                Foco & Bons Hábitos
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
              Organize seus estudos no seu próprio ritmo
            </p>
          </div>
        </div>

        {/* Barra de Status Gamificada (Streak, Nível e XP) */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Streak diário */}
          <button
            onClick={() => { audioService.playClick(); onOpenGamification(); }}
            title="Sua sequência de dias consecutivos focando"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 text-xs font-bold transition hover:scale-105 active:scale-95"
          >
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>{profile.streakDays} {profile.streakDays === 1 ? 'dia' : 'dias'}</span>
          </button>

          {/* Nível e XP */}
          <button
            onClick={() => { audioService.playClick(); onOpenGamification(); }}
            title="Seu nível acadêmico e progresso de experiência"
            className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-stone-800 border border-amber-200/60 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs transition hover:scale-105"
          >
            <div className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>Nível {profile.level}</span>
            </div>
            <div className="w-20 bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
              {profile.xp}/{xpNeeded} XP
            </span>
          </button>

          {/* StudyCoins */}
          <button
            onClick={() => { audioService.playClick(); onOpenGamification(); }}
            title="Suas moedas para desbloquear recompensas e avatares"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-300/50 dark:border-amber-700/50 transition hover:scale-105"
          >
            <span>🪙</span>
            <span>{profile.studyCoins}</span>
          </button>
        </div>

        {/* Ferramentas e Recursos IA */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Botão Gemini Live (Voz em Tempo Real) */}
          <button
            onClick={() => { audioService.playClick(); onOpenVoiceLive(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-linear-to-r from-orange-500/15 to-amber-500/15 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-200 hover:scale-105 text-xs font-bold transition shadow-2xs"
            title="Conversar por Voz em Tempo Real com o Tutor (Gemini 3.8 Live)"
          >
            <Mic className="w-4 h-4 text-orange-600 dark:text-orange-400 animate-pulse" />
            <span className="hidden xl:inline">Tutor por Voz</span>
          </button>

          {/* Botão Chatbot com Google Search */}
          <button
            onClick={() => { audioService.playClick(); onOpenChatbot(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-amber-200/80 dark:border-stone-700 hover:bg-amber-100/80 text-xs font-medium transition"
            title="Chat com Mentor de Estudos & Google Search Grounding"
          >
            <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden lg:inline">Mentor Chat</span>
          </button>

          {/* Botão Transcrever Áudio */}
          <button
            onClick={() => { audioService.playClick(); onOpenTranscribe(); }}
            className="p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Transcrever Gravações ou Ditado de Voz (Gemini 3.5 Transcribe)"
          >
            <FileAudio className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </button>

          {/* Ferramentas de Resumo */}
          <button
            onClick={() => { audioService.playClick(); onOpenSummaries(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium transition"
            title="Ferramentas de Resumos, Flashcards e Sínteses"
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden 2xl:inline">Resumos</span>
          </button>

          {/* Materiais / Arquivos */}
          <button
            onClick={() => { audioService.playClick(); onOpenMaterials(); }}
            className="p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Upload e Biblioteca de Materiais de Estudo"
          >
            <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Estatísticas */}
          <button
            onClick={() => { audioService.playClick(); onOpenStats(); }}
            className="p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Ver Painel de Estatísticas e Progresso"
          >
            <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </button>

          {/* Notificações Push */}
          <button
            onClick={() => { audioService.playClick(); onToggleNotification(); }}
            className={`p-2 rounded-xl transition ${
              notificationGranted 
                ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40' 
                : 'text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title={notificationGranted ? 'Notificações Ativadas' : 'Ativar lembretes e avisos'}
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Alternador de Tema Acolhedor */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title={`Tema atual: ${theme}. Clique para alternar.`}
          >
            {theme === 'cozy-light' && <Coffee className="w-4 h-4 text-amber-700" />}
            {theme === 'warm-amber' && <Sun className="w-4 h-4 text-amber-500" />}
            {theme === 'deep-dark' && <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Exportar Dados */}
          <button
            onClick={() => { audioService.playClick(); onExportMenu(); }}
            className="p-2 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            title="Exportar dados em CSV ou PDF"
          >
            <Download className="w-4 h-4 text-stone-600 dark:text-stone-300" />
          </button>

          {/* Botão Novo Objetivo */}
          <button
            onClick={() => { audioService.playClick(); onOpenNewGoal(); }}
            className="ml-1 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs hover:shadow-md transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline font-semibold">Novo Objetivo</span>
          </button>

        </div>
      </div>
    </header>
  );
};
