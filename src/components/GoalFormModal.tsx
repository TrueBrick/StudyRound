import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calendar, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { StudyGoal, GoalCategory, GoalPriority, GoalStatus } from '../types/study';
import { audioService } from '../services/audioService';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: {
    title: string;
    description: string;
    deadline: string;
    status: GoalStatus;
    priority: GoalPriority;
    category: GoalCategory;
    estimatedPomodoros: number;
  }) => void;
  initialGoal?: StudyGoal | null;
}

const CATEGORIES: GoalCategory[] = [
  'Geral',
  'Matemática',
  'Linguagens',
  'Ciências',
  'Humanas',
  'Programação',
  'Concursos',
  'Idiomas',
];

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialGoal,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<GoalStatus>('todo');
  const [priority, setPriority] = useState<GoalPriority>('media');
  const [category, setCategory] = useState<GoalCategory>('Geral');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(2);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setDescription(initialGoal.description || '');
      setDeadline(initialGoal.deadline || '');
      setStatus(initialGoal.status);
      setPriority(initialGoal.priority || 'media');
      setCategory(initialGoal.category || 'Geral');
      setEstimatedPomodoros(initialGoal.estimatedPomodoros || 2);
    } else {
      // Default: sugerir amanhã como prazo inicial gentil
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      setTitle('');
      setDescription('');
      setDeadline(tomorrow.toISOString().split('T')[0]);
      setStatus('todo');
      setPriority('media');
      setCategory('Geral');
      setEstimatedPomodoros(2);
    }
    setError('');
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, dê um título amigável ao seu objetivo.');
      return;
    }

    audioService.playClick();
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      deadline,
      status,
      priority,
      category,
      estimatedPomodoros: Math.max(1, estimatedPomodoros),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-amber-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                {initialGoal ? 'Editar Objetivo de Estudo' : 'Cadastrar Novo Objetivo'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Fatie suas matérias em passos claros e sem estresse
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

        {/* Formulário Intuitivo */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Campo: Título */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Título do Objetivo <span className="text-amber-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Resolver 15 exercícios de Cinemática Vetorial"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
            />
          </div>

          {/* Linha dupla: Categoria e Prazo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Matéria / Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Prazo Limite
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Campo: Descrição / Anotações */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Descrição e Detalhes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Focar nas fórmulas de aceleração centrípeta e revisar os erros do simulado anterior..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition resize-none"
            />
          </div>

          {/* Linha tripla: Prioridade, Status e Estimativa de Pomodoros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GoalPriority)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta 🔥</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Status Atual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              >
                <option value="todo">A Fazer</option>
                <option value="in_progress">Em Progresso</option>
                <option value="completed">Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5" title="Quantos ciclos de 25 min você estima para esta tarefa?">
                Pomodoros (25m)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={estimatedPomodoros}
                  onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs text-center font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <span className="text-xs text-stone-500 dark:text-stone-400">blocos</span>
              </div>
            </div>
          </div>

          {/* Dica acolhedora */}
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-900/40 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              <strong>Dica de Produtividade:</strong> Divida grandes matérias em blocos de até 2 ou 3 Pomodoros. Pequenas vitórias diárias mantêm sua dopamina e foco elevados!
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95"
            >
              {initialGoal ? 'Salvar Alterações' : 'Criar Objetivo'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
