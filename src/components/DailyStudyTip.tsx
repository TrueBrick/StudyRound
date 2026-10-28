import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  RotateCw, 
  ArrowRight, 
  Target, 
  CheckCircle, 
  BookOpen,
  Brain
} from 'lucide-react';
import { StudyGoal } from '../types/study';
import { audioService } from '../services/audioService';

interface DailyStudyTipProps {
  goals: StudyGoal[];
  studentName: string;
  level: number;
  streakDays: number;
  onFocusGoal: (goal: StudyGoal) => void;
}

interface TipData {
  tip: string;
  priorityGoalTitle?: string;
  priorityReason?: string;
  recommendedTechnique: string;
  inspirationalQuote: string;
  isFallback?: boolean;
}

const CACHE_KEY = 'studyround_daily_tip_cache';

export const DailyStudyTip: React.FC<DailyStudyTipProps> = ({
  goals,
  studentName,
  level,
  streakDays,
  onFocusGoal,
}) => {
  const [tipData, setTipData] = useState<TipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const openGoals = goals.filter(g => g.status !== 'completed');

  const fetchTip = async (forceRefresh: boolean = false) => {
    // Verificar cache diário se não for forçado
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const today = new Date().toISOString().split('T')[0];
          if (parsed.date === today && parsed.data) {
            setTipData(parsed.data);
            return;
          }
        }
      } catch (e) {
        // ignorar cache corrompido
      }
    }

    setLoading(true);
    setError(false);

    try {
      const response = await fetch('/api/study-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: openGoals.map(g => ({
            id: g.id,
            title: g.title,
            category: g.category,
            priority: g.priority,
            deadline: g.deadline,
            completedPomodoros: g.completedPomodoros,
            estimatedPomodoros: g.estimatedPomodoros,
            status: g.status,
          })),
          studentName,
          level,
          streakDays,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha na resposta do servidor');
      }

      const data = await response.json();
      if (data && data.tip) {
        setTipData(data);
        // Salvar em cache para hoje
        try {
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem(CACHE_KEY, JSON.stringify({ date: today, data }));
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar dica com Gemini:', err);
      setError(true);
      // Fallback amigável
      const defaultGoal = openGoals[0];
      setTipData({
        tip: defaultGoal
          ? `Sugerimos começar hoje por "${defaultGoal.title}". Realizar um único bloco de 25 minutos no início da sessão reduz a inércia e estabelece o ritmo para as próximas matérias.`
          : 'Mantenha a regularidade nos estudos com blocos de foco de 25 minutos seguidos por 5 minutos de pausa ativa.',
        priorityGoalTitle: defaultGoal?.title,
        priorityReason: 'Concluir tarefas em andamento traz alívio mental e renova sua motivação.',
        recommendedTechnique: 'Técnica Pomodoro 25/5 com Revisão Ativa',
        inspirationalQuote: 'Constância supera intensidade: um round de cada vez.',
        isFallback: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTip(false);
  }, []); // Carga inicial

  const handleRefresh = () => {
    audioService.playClick();
    fetchTip(true);
  };

  // Encontrar o objetivo sugerido caso exista
  const suggestedGoal = tipData?.priorityGoalTitle 
    ? openGoals.find(g => g.title.toLowerCase().includes(tipData.priorityGoalTitle!.toLowerCase()) || tipData.priorityGoalTitle!.toLowerCase().includes(g.title.toLowerCase()))
    : openGoals[0];

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border transition-all duration-300
      bg-linear-to-br from-amber-500/10 via-amber-500/5 to-orange-500/10 dark:from-amber-950/40 dark:via-stone-900 dark:to-orange-950/30
      border-amber-300/60 dark:border-amber-800/50 shadow-sm"
    >
      {/* Detalhe decorativo suave de fundo */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 rounded-full bg-amber-400/10 dark:bg-amber-400/5 blur-xl pointer-events-none" />

      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                Dica de Estudo do Dia
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 flex items-center gap-1">
                <Brain className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>IA Gemini</span>
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 rounded-xl text-stone-500 hover:text-amber-700 dark:text-stone-400 dark:hover:text-amber-300 hover:bg-white/70 dark:hover:bg-stone-800 transition disabled:opacity-50"
          title="Gerar nova dica com IA"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
        </button>
      </div>

      {/* Corpo da Dica */}
      {loading ? (
        <div className="py-4 space-y-2 animate-pulse">
          <div className="h-3.5 bg-amber-200/50 dark:bg-stone-800 rounded-md w-3/4" />
          <div className="h-3.5 bg-amber-200/40 dark:bg-stone-800 rounded-md w-full" />
          <div className="h-3.5 bg-amber-200/30 dark:bg-stone-800 rounded-md w-2/3" />
        </div>
      ) : tipData ? (
        <div className="space-y-3.5 relative z-10">
          
          {/* Texto Principal da Dica */}
          <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
            {tipData.tip}
          </p>

          {/* Destaque: Objetivo Prioritário & Técnica Recomendada */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                ⚡ Técnica: {tipData.recommendedTechnique}
              </span>

              {tipData.inspirationalQuote && (
                <span className="text-[11px] text-stone-500 dark:text-stone-400 italic">
                  "{tipData.inspirationalQuote}"
                </span>
              )}
            </div>

            {/* Ação rápida para o objetivo recomendado */}
            {suggestedGoal && (
              <button
                onClick={() => {
                  audioService.playClick();
                  onFocusGoal(suggestedGoal);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 shrink-0"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Focar em "{suggestedGoal.title.slice(0, 22)}{suggestedGoal.title.length > 22 ? '...' : ''}"</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

          </div>

        </div>
      ) : null}

    </div>
  );
};
