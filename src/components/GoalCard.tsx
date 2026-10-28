import React from 'react';
import { 
  Play, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  Paperclip, 
  Edit3, 
  Trash2, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyGoal } from '../types/study';
import { audioService } from '../services/audioService';

interface GoalCardProps {
  goal: StudyGoal;
  isActiveInPomodoro: boolean;
  onStartPomodoro: (goal: StudyGoal) => void;
  onEdit: (goal: StudyGoal) => void;
  onDelete: (goalId: string) => void;
  onToggleStatus: (goal: StudyGoal) => void;
  onOpenMaterialsForGoal: (goalId: string) => void;
  onOpenSummaryForGoal: (goal: StudyGoal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  isActiveInPomodoro,
  onStartPomodoro,
  onEdit,
  onDelete,
  onToggleStatus,
  onOpenMaterialsForGoal,
  onOpenSummaryForGoal,
}) => {
  const isCompleted = goal.status === 'completed';

  const handleToggle = () => {
    audioService.playClick();
    if (!isCompleted) {
      audioService.playTaskSuccess();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899'],
      });
    }
    onToggleStatus(goal);
  };

  // Cálculo de prazo amigável
  const getDeadlineText = (deadlineStr?: string) => {
    if (!deadlineStr) return { text: 'Sem data limite', color: 'text-stone-400' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr + 'T00:00:00');
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Atrasado há ${Math.abs(diffDays)}d`, color: 'text-rose-600 dark:text-rose-400 font-semibold' };
    if (diffDays === 0) return { text: 'Vence hoje!', color: 'text-amber-600 dark:text-amber-400 font-semibold' };
    if (diffDays === 1) return { text: 'Amanhã', color: 'text-amber-600 dark:text-amber-400' };
    if (diffDays <= 5) return { text: `Em ${diffDays} dias`, color: 'text-stone-600 dark:text-stone-300' };
    return { text: deadline.toLocaleDateString('pt-BR'), color: 'text-stone-500 dark:text-stone-400' };
  };

  const deadlineInfo = getDeadlineText(goal.deadline);

  // Cores suaves por categoria
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Matemática':
        return 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'Linguagens':
        return 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900';
      case 'Ciências':
        return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'Humanas':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'Programação':
        return 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900';
      case 'Concursos':
        return 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900';
      default:
        return 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700';
    }
  };

  return (
    <div
      className={`group relative rounded-2xl p-5 transition-all duration-200 border flex flex-col justify-between
        ${isCompleted 
          ? 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200/80 dark:border-stone-800/80 opacity-75' 
          : isActiveInPomodoro
            ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-400/20'
            : 'bg-white dark:bg-stone-800/90 border-amber-900/10 dark:border-stone-700/80 hover:border-amber-400/50 hover:shadow-md'
        }`}
    >
      <div>
        {/* Cabeçalho do Cartão: Categoria & Prioridade */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryStyles(goal.category)}`}>
              {goal.category}
            </span>
            {goal.priority === 'alta' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                Alta Prioridade
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-1">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Concluído
              </span>
            ) : goal.status === 'in_progress' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> Em Foco
              </span>
            ) : (
              <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                A Fazer
              </span>
            )}
          </div>
        </div>

        {/* Título & Checkbox */}
        <div className="flex items-start gap-3">
          <button
            onClick={handleToggle}
            className="mt-0.5 text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition shrink-0"
            title={isCompleted ? 'Marcar como não concluído' : 'Marcar como concluído'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-bold leading-snug tracking-tight ${
              isCompleted 
                ? 'line-through text-stone-400 dark:text-stone-500' 
                : 'text-stone-800 dark:text-stone-100'
            }`}>
              {goal.title}
            </h3>

            {goal.description && (
              <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                {goal.description}
              </p>
            )}
          </div>
        </div>

        {/* Indicadores: Prazo & Materiais Anexados */}
        <div className="mt-3.5 flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
            <Calendar className="w-3.5 h-3.5" />
            <span className={deadlineInfo.color}>{deadlineInfo.text}</span>
          </div>

          {goal.attachedFileIds && goal.attachedFileIds.length > 0 && (
            <button
              onClick={() => onOpenMaterialsForGoal(goal.id)}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>{goal.attachedFileIds.length} {goal.attachedFileIds.length === 1 ? 'material' : 'materiais'}</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{goal.totalFocusMinutes || 0} min de foco</span>
          </div>
        </div>

        {/* Barra de Progresso Pomodoro */}
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-700/60">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone-500 dark:text-stone-400 font-medium">
              Pomodoros de foco:
            </span>
            <span className="font-semibold text-stone-700 dark:text-stone-200">
              {goal.completedPomodoros} / {goal.estimatedPomodoros}
            </span>
          </div>

          <div className="w-full bg-stone-100 dark:bg-stone-700 h-2 rounded-full overflow-hidden flex gap-1 p-0.5">
            {Array.from({ length: Math.max(goal.estimatedPomodoros, 1) }).map((_, i) => (
              <div
                key={i}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  i < goal.completedPomodoros 
                    ? 'bg-amber-500 dark:bg-amber-400' 
                    : 'bg-stone-200 dark:bg-stone-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Ações Inferiores */}
      <div className="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-700/60">
        
        {/* Botão de Acionar Pomodoro com a Tarefa */}
        <button
          onClick={() => { audioService.playClick(); onStartPomodoro(goal); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
            isActiveInPomodoro
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200/80 dark:hover:bg-amber-900/50'
          }`}
          title="Focar neste objetivo agora no Pomodoro"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isActiveInPomodoro ? 'Focando Agora' : 'Iniciar Foco'}</span>
        </button>

        {/* Ações Secundárias: Resumir, Editar, Excluir */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { audioService.playClick(); onOpenSummaryForGoal(goal); }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition"
            title="Criar resumo e flashcards para este objetivo"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => { audioService.playClick(); onEdit(goal); }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition"
            title="Editar objetivo"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => { audioService.playClick(); onDelete(goal.id); }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-700/50 transition"
            title="Excluir objetivo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
