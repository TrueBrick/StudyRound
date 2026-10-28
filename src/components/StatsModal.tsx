import React from 'react';
import { X, BarChart3, Clock, CheckCircle2, Target, Calendar, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { StudyGoal, FocusSession, UserProfile } from '../types/study';
import { audioService } from '../services/audioService';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: StudyGoal[];
  sessions: FocusSession[];
  profile: UserProfile;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  goals,
  sessions,
  profile,
  onExportCSV,
  onExportPDF,
}) => {
  if (!isOpen) return null;

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Calcular foco por dia nos últimos 7 dias
  const last7Days: { dateStr: string; label: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short' });
    
    // Somar minutos das sessões desse dia
    const dayMinutes = sessions
      .filter(s => s.completedAt.startsWith(dateStr) && s.mode === 'focus')
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    last7Days.push({ dateStr, label: dayLabel, minutes: dayMinutes });
  }

  // Se não houver sessões recentes registradas hoje, preencher com os dados do perfil proporcionalmente para o gráfico ter visual útil
  const maxDayMinutes = Math.max(...last7Days.map(d => d.minutes), 30);

  // Distribuição por Categoria
  const categoryCounts: Record<string, number> = {};
  goals.forEach(g => {
    categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-amber-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                Painel de Estatísticas de Desempenho
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Acompanhe o tempo investido no seu aprendizado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700">
              <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Foco Acumulado</span>
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1 font-mono">
                {profile.totalMinutesFocused} min
              </div>
              <span className="text-[10px] text-stone-400">
                {(profile.totalMinutesFocused / 60).toFixed(1)} horas líquidas
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700">
              <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Metas Concluídas</span>
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1 font-mono">
                {completedGoals} / {totalGoals}
              </div>
              <span className="text-[10px] text-stone-400">
                {completionRate}% de aproveitamento
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700">
              <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>Sequência Diária</span>
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1 font-mono">
                {profile.streakDays} dias
              </div>
              <span className="text-[10px] text-stone-400">
                Constância mantida
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700">
              <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs font-semibold">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <span>Total de Sessões</span>
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1 font-mono">
                {sessions.length || goals.reduce((acc, g) => acc + g.completedPomodoros, 0)}
              </div>
              <span className="text-[10px] text-stone-400">
                Rounds de Pomodoro
              </span>
            </div>
          </div>

          {/* Gráfico Visual: Foco nos Últimos 7 Dias */}
          <div className="p-5 rounded-3xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Minutos de Estudo por Dia (Últimos 7 Dias)
              </h3>
              <span className="text-[11px] text-stone-400">Meta recomendada: 50m/dia</span>
            </div>

            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-stone-100 dark:border-stone-700">
              {last7Days.map((d, idx) => {
                const heightPercent = Math.max(8, Math.min(100, (d.minutes / maxDayMinutes) * 100));
                const isToday = idx === 6;

                return (
                  <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 opacity-0 group-hover:opacity-100 transition">
                      {d.minutes}m
                    </span>
                    <div 
                      className={`w-full max-w-9 rounded-t-xl transition-all duration-500 ${
                        isToday 
                          ? 'bg-amber-500 dark:bg-amber-400' 
                          : d.minutes > 0 
                            ? 'bg-amber-300 dark:bg-amber-600/70' 
                            : 'bg-stone-100 dark:bg-stone-700/60'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className={`text-[11px] font-semibold capitalize ${
                      isToday ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-stone-400'
                    }`}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribuição por Categoria */}
          <div className="p-5 rounded-3xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Distribuição dos Objetivos por Matéria
            </h3>

            <div className="space-y-2">
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const percent = Math.round((count / totalGoals) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs text-stone-700 dark:text-stone-300 font-medium">
                      <span>{cat}</span>
                      <span>{count} {count === 1 ? 'meta' : 'metas'} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ações de Exportação */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Exportar Histórico e Desempenho
              </h4>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                Gere cópias de segurança ou relatórios para imprimir
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => { audioService.playClick(); onExportCSV(); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-amber-300/60 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold hover:bg-stone-50 shadow-xs transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar CSV</span>
              </button>

              <button
                onClick={() => { audioService.playClick(); onExportPDF(); }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

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
