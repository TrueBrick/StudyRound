import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  RotateCw, 
  Check, 
  HelpCircle, 
  Layers, 
  FileText, 
  Download,
  BookmarkCheck,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudySummary, StudyGoal, StudyFile, Flashcard } from '../types/study';
import { summaryService } from '../services/summaryService';
import { audioService } from '../services/audioService';

interface SummaryToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: StudyGoal[];
  files: StudyFile[];
  initialGoal?: StudyGoal | null;
  initialFile?: StudyFile | null;
  onSaveSummary: (summary: Omit<StudySummary, 'id' | 'createdAt'>) => void;
  savedSummaries: StudySummary[];
  onDeleteSummary: (id: string) => void;
}

type TabType = 'generator' | 'flashcards' | 'quiz' | 'cornell' | 'library';

export const SummaryToolsModal: React.FC<SummaryToolsModalProps> = ({
  isOpen,
  onClose,
  goals,
  files,
  initialGoal,
  initialFile,
  onSaveSummary,
  savedSummaries,
  onDeleteSummary,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('generator');
  const [inputTitle, setInputTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [activeSummary, setActiveSummary] = useState<Omit<StudySummary, 'id' | 'createdAt'> | null>(null);
  
  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>([]);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Cornell Notes state
  const [cornellCues, setCornellCues] = useState('');
  const [cornellNotes, setCornellNotes] = useState('');
  const [cornellSummary, setCornellSummary] = useState('');

  // Sincronizar ao abrir com objetivo ou arquivo pré-selecionado
  useEffect(() => {
    if (initialGoal) {
      setInputTitle(`Resumo: ${initialGoal.title}`);
      setInputText(initialGoal.description || '');
      setSelectedGoalId(initialGoal.id);
    } else if (initialFile) {
      setInputTitle(`Resumo: ${initialFile.name}`);
      setInputText(initialFile.textContent || initialFile.notes || '');
      setSelectedGoalId(initialFile.goalId || '');
    } else {
      // Exemplo prático amigável
      if (!inputText) {
        setInputTitle('Técnicas de Repetição Espaçada e Foco');
        setInputText(
          'A repetição espaçada é uma técnica de aprendizagem baseada na curva do esquecimento de Hermann Ebbinghaus. Conceito: A memória consolida informações quando revisadas em intervalos crescentes. O método Pomodoro, criado por Francesco Cirillo, divide o estudo em blocos de 25 minutos seguidos de pausas de 5 minutos. Ponto fundamental: As pausas curtas ajudam a restaurar os níveis de neurotransmissores e oxigênio cerebral. Aplicação prática: Intercalar 4 blocos de foco com 1 intervalo longo de 15 a 30 minutos garante retenção sem exaustão.'
        );
      }
    }
  }, [initialGoal, initialFile, isOpen]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    audioService.playClick();

    const titleToUse = inputTitle.trim() || 'Resumo de Estudos';
    const generated = summaryService.generateStructuredSummary(
      inputText, 
      titleToUse, 
      initialFile?.name, 
      selectedGoalId || undefined
    );

    setActiveSummary(generated);
    setLocalFlashcards(generated.flashcards || []);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setQuizAnswers({});
    setShowQuizResults(false);

    // Preencher Cornell Notes prévio
    setCornellCues(generated.keyPoints.slice(0, 3).join('\n• '));
    setCornellNotes(generated.overview);
    setCornellSummary(generated.takeaways);

    audioService.playTaskSuccess();
  };

  const handleSaveToLibrary = () => {
    if (!activeSummary) return;
    audioService.playTaskSuccess();
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
    });
    onSaveSummary(activeSummary);
    setActiveTab('library');
  };

  const toggleFlipCard = () => {
    audioService.playClick();
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    audioService.playClick();
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % localFlashcards.length);
  };

  const handlePrevCard = () => {
    audioService.playClick();
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + localFlashcards.length) % localFlashcards.length);
  };

  const toggleMastered = (cardId: string) => {
    audioService.playClick();
    setLocalFlashcards(cards => 
      cards.map(c => c.id === cardId ? { ...c, mastered: !c.mastered } : c)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-emerald-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                Ferramentas de Resumo e Memorização
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Transforme anotações em sínteses, flashcards interativos e quizzes de fixação
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

        {/* Barra de Abas Aconchegante */}
        <div className="px-6 pt-3 border-b border-stone-100 dark:border-stone-800 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar bg-stone-50/60 dark:bg-stone-900/40">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'generator'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gerador & Resumo</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'flashcards'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcards ({localFlashcards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'quiz'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz de Fixação</span>
          </button>

          <button
            onClick={() => setActiveTab('cornell')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'cornell'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notas Cornell</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'library'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Biblioteca Salva ({savedSummaries.length})</span>
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ABA 1: GERADOR & RESUMO ESTRUTURADO */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              
              {/* Caixa de Entrada */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Título do Tema ou Resumo:
                    </label>
                    <input
                      type="text"
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      placeholder="Ex: Revolução Industrial ou Genética Básica"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Vincular ao Objetivo:
                    </label>
                    <select
                      value={selectedGoalId}
                      onChange={(e) => setSelectedGoalId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="">Nenhum (Resumo Geral)</option>
                      {goals.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Texto ou Conteúdo de Estudo para Resumir:
                  </label>
                  <textarea
                    rows={4}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Cole aqui capítulos, anotações de aula, fórmulas ou conceitos que você precisa sintetizar..."
                    className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-stone-400">
                    {inputText.length} caracteres digitados
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={!inputText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition active:scale-95 shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Processar e Estruturar Resumo</span>
                  </button>
                </div>
              </div>

              {/* Resultado do Resumo Estruturado */}
              {activeSummary ? (
                <div className="p-6 rounded-3xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-5">
                  
                  <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/40 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                        Síntese Acadêmica
                      </span>
                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-1">
                        {activeSummary.title}
                      </h3>
                    </div>

                    <button
                      onClick={handleSaveToLibrary}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <BookmarkCheck className="w-4 h-4" />
                      <span>Salvar na Biblioteca (+40 XP)</span>
                    </button>
                  </div>

                  {/* Visão Geral */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Visão Geral & Contexto</span>
                    </h4>
                    <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed bg-white dark:bg-stone-800 p-3.5 rounded-2xl border border-stone-200/60 dark:border-stone-700">
                      {activeSummary.overview}
                    </p>
                  </div>

                  {/* Pontos-Chave */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pontos-Chave Essenciais</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeSummary.keyPoints.map((point, idx) => (
                        <div 
                          key={idx}
                          className="flex items-start gap-2 p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300"
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-snug">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conceitos e Glossário */}
                  {activeSummary.concepts.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                        Glossário de Conceitos
                      </h4>
                      <div className="space-y-1.5">
                        {activeSummary.concepts.map((c, i) => (
                          <div 
                            key={i}
                            className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 text-xs flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2"
                          >
                            <span className="font-bold text-stone-900 dark:text-stone-100 shrink-0">
                              {c.term}:
                            </span>
                            <span className="text-stone-600 dark:text-stone-300">
                              {c.definition}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dica de Fixação */}
                  <div className="p-3 bg-amber-100/60 dark:bg-amber-950/40 rounded-2xl border border-amber-300/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
                    <span>💡 <strong>Próximo passo:</strong> Acesse a aba <strong>Flashcards</strong> para fixar o conteúdo na memória!</span>
                    <button
                      onClick={() => setActiveTab('flashcards')}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700"
                    >
                      Ir para Flashcards →
                    </button>
                  </div>

                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">
                  Digite ou cole seu conteúdo acima e clique em "Processar e Estruturar Resumo" para começar.
                </div>
              )}

            </div>
          )}

          {/* ABA 2: FLASHCARDS INTERATIVOS COM FLIP */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6 max-w-xl mx-auto">
              
              {localFlashcards.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Nenhum Flashcard Ativo</p>
                  <p className="text-xs text-stone-400 mt-1">Gere um resumo primeiro para criar cartões automáticos de estudo.</p>
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                  >
                    Ir para o Gerador
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Indicador de progresso */}
                  <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                    <span>Cartão {currentCardIndex + 1} de {localFlashcards.length}</span>
                    <span>
                      {localFlashcards.filter(c => c.mastered).length} dominados
                    </span>
                  </div>

                  {/* Cartão com Efeito Flip */}
                  <div
                    onClick={toggleFlipCard}
                    className="h-64 cursor-pointer perspective-1000 group"
                  >
                    <div className={`relative w-full h-full rounded-3xl p-8 flex flex-col justify-between text-center border transition-all duration-300 shadow-md ${
                      isFlipped 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800' 
                        : 'bg-white dark:bg-stone-800 border-amber-200 dark:border-stone-700'
                    }`}>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        {isFlipped ? 'Resposta / Definição' : 'Pergunta / Conceito (Clique para virar)'}
                      </div>

                      <div className="my-auto">
                        <p className={`font-serif text-lg sm:text-xl font-bold leading-relaxed ${
                          isFlipped ? 'text-emerald-950 dark:text-emerald-200' : 'text-stone-900 dark:text-stone-100'
                        }`}>
                          {isFlipped 
                            ? localFlashcards[currentCardIndex]?.back 
                            : localFlashcards[currentCardIndex]?.front}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-1 text-[11px] text-stone-400">
                        <RotateCw className="w-3 h-3" />
                        <span>Toque no cartão para alternar frente e verso</span>
                      </div>
                    </div>
                  </div>

                  {/* Controles de Navegação */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={handlePrevCard}
                      className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-200"
                    >
                      ← Anterior
                    </button>

                    <button
                      onClick={() => toggleMastered(localFlashcards[currentCardIndex].id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                        localFlashcards[currentCardIndex]?.mastered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-emerald-600'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{localFlashcards[currentCardIndex]?.mastered ? 'Dominado ✨' : 'Marcar como Dominado'}</span>
                    </button>

                    <button
                      onClick={handleNextCard}
                      className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-200"
                    >
                      Próximo →
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ABA 3: QUIZ DE FIXAÇÃO */}
          {activeTab === 'quiz' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {(!activeSummary || !activeSummary.quiz || activeSummary.quiz.length === 0) ? (
                <div className="text-center py-10">
                  <HelpCircle className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Nenhum Quiz Criado</p>
                  <p className="text-xs text-stone-400 mt-1">Gere um resumo para obter o quiz de auto-avaliação automático.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeSummary.quiz.map((q, qIdx) => {
                    const selectedOpt = quizAnswers[q.id];
                    const hasAnswered = selectedOpt !== undefined;
                    const isCorrect = selectedOpt === q.correctIndex;

                    return (
                      <div 
                        key={q.id}
                        className="p-5 rounded-3xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 space-y-3"
                      >
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                            {qIdx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {q.question}
                          </h4>
                        </div>

                        {/* Opções */}
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            let style = 'bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-700 hover:border-emerald-400';
                            if (hasAnswered) {
                              if (optIdx === q.correctIndex) {
                                style = 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold';
                              } else if (selectedOpt === optIdx) {
                                style = 'bg-rose-100/70 dark:bg-rose-950/60 border-rose-400 text-rose-900 dark:text-rose-200';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={hasAnswered}
                                onClick={() => {
                                  audioService.playClick();
                                  setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }));
                                  if (optIdx === q.correctIndex) {
                                    audioService.playTaskSuccess();
                                  }
                                }}
                                className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${style}`}
                              >
                                <span>{opt}</span>
                                {hasAnswered && optIdx === q.correctIndex && (
                                  <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Explicação Didática */}
                        {hasAnswered && (
                          <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                            isCorrect 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200' 
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                          }`}>
                            <p className="font-bold mb-0.5">{isCorrect ? '✅ Resposta Exata!' : '❌ Ops! Quase lá:'}</p>
                            <p>{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 4: NOTAS MÉTODO CORNELL */}
          {activeTab === 'cornell' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/50 text-xs text-amber-900 dark:text-amber-200">
                <strong>O Método Cornell</strong> estimula a retenção dividindo a folha em <strong>Dúvidas & Gatilhos</strong> (à esquerda), <strong>Anotações Principais</strong> (à direita) e <strong>Síntese Final</strong> (no rodapé).
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Coluna de Dúvidas & Gatilhos */}
                <div className="md:col-span-1 space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Perguntas & Gatilhos (Cues):
                  </label>
                  <textarea
                    rows={10}
                    value={cornellCues}
                    onChange={(e) => setCornellCues(e.target.value)}
                    placeholder="• O que é X?&#10;• Fórmula principal?&#10;• Exceções à regra?"
                    className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/30 resize-none font-mono"
                  />
                </div>

                {/* Coluna de Notas Principais */}
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Anotações Estruturadas:
                  </label>
                  <textarea
                    rows={10}
                    value={cornellNotes}
                    onChange={(e) => setCornellNotes(e.target.value)}
                    placeholder="Anote detalhes conceituais, passos de resolução, diagramas mentais..."
                    className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  />
                </div>
              </div>

              {/* Rodapé: Sumário Final */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  Resumo Final em 2 Linhas:
                </label>
                <input
                  type="text"
                  value={cornellSummary}
                  onChange={(e) => setCornellSummary(e.target.value)}
                  placeholder="Conclusão sintética para lembrar antes de dormir ou antes da prova..."
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>
          )}

          {/* ABA 5: BIBLIOTECA DE RESUMOS SALVOS */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {savedSummaries.length === 0 ? (
                <div className="text-center py-12">
                  <BookmarkCheck className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Nenhum Resumo Salvo</p>
                  <p className="text-xs text-stone-400 mt-1">Crie seu primeiro resumo na aba de geração para consultá-lo sempre que precisar!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedSummaries.map((s) => (
                    <div 
                      key={s.id}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                            {s.title}
                          </h4>
                          <button
                            onClick={() => { audioService.playClick(); onDeleteSummary(s.id); }}
                            className="text-stone-400 hover:text-rose-600 p-1"
                            title="Excluir resumo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5 line-clamp-3">
                          {s.overview}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-700 flex items-center justify-between">
                        <span className="text-[10px] text-stone-400">
                          {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          onClick={() => {
                            audioService.playClick();
                            setActiveSummary(s);
                            setLocalFlashcards(s.flashcards || []);
                            setActiveTab('generator');
                          }}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <span>Abrir e Estudar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
