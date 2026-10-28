import React from 'react';
import { Sparkles, Plus, BookOpen, Coffee } from 'lucide-react';
import { audioService } from '../services/audioService';

interface EmptyStateProps {
  onOpenNewGoal: () => void;
  onRestoreExamples: () => void;
  isFiltered?: boolean;
  onClearFilter?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenNewGoal,
  onRestoreExamples,
  isFiltered,
  onClearFilter,
}) => {
  return (
    <div className="text-center py-14 px-6 rounded-3xl border-2 border-dashed border-amber-200/80 dark:border-stone-800 bg-amber-50/30 dark:bg-stone-900/40 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-xs">
        <Coffee className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200 font-serif">
        {isFiltered ? 'Nenhum objetivo encontrado com este filtro' : 'Seu espaço de estudos está tranquilo e limpo'}
      </h3>

      <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-2 leading-relaxed">
        {isFiltered 
          ? 'Tente selecionar outra categoria ou limpar a busca para visualizar suas outras metas.' 
          : 'Que tal definir um objetivo leve para hoje? Dividir em pequenos passos é o segredo para aprender sem sobrecarga.'}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {isFiltered ? (
          <button
            onClick={() => { audioService.playClick(); onClearFilter && onClearFilter(); }}
            className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-300 transition"
          >
            Limpar Filtro
          </button>
        ) : (
          <>
            <button
              onClick={() => { audioService.playClick(); onOpenNewGoal(); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Objetivo</span>
            </button>

            <button
              onClick={() => { audioService.playClick(); onRestoreExamples(); }}
              className="px-4 py-2.5 rounded-xl border border-amber-300/60 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-semibold hover:bg-white dark:hover:bg-stone-800 transition"
            >
              Carregar Metas Exemplo
            </button>
          </>
        )}
      </div>
    </div>
  );
};
