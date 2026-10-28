import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  FolderOpen, 
  FileText, 
  Flame, 
  Coffee,
  HelpCircle,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  StudyGoal, 
  StudyFile, 
  StudySummary, 
  UserProfile, 
  GoalCategory, 
  GoalStatus, 
  GoalPriority 
} from './types/study';
import { storageService, INITIAL_BADGES } from './services/storageService';
import { audioService } from './services/audioService';
import { notificationService } from './services/notificationService';
import { exportService } from './services/exportService';

// Componentes modulares
import { Navbar } from './components/Navbar';
import { GoalCard } from './components/GoalCard';
import { GoalFormModal } from './components/GoalFormModal';
import { PomodoroTimer } from './components/PomodoroTimer';
import { StudyMaterialsModal } from './components/StudyMaterialsModal';
import { SummaryToolsModal } from './components/SummaryToolsModal';
import { GamificationModal } from './components/GamificationModal';
import { StatsModal } from './components/StatsModal';
import { EmptyState } from './components/EmptyState';
import { DailyStudyTip } from './components/DailyStudyTip';
import { VoiceConversationModal } from './components/VoiceConversationModal';
import { GeminiChatbotModal } from './components/GeminiChatbotModal';
import { AudioTranscriberModal } from './components/AudioTranscriberModal';

export default function App() {
  // Estado de Dados
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [files, setFiles] = useState<StudyFile[]>([]);
  const [summaries, setSummaries] = useState<StudySummary[]>([]);
  const [profile, setProfile] = useState<UserProfile>(storageService.getProfile());

  // Estado do Timer & Objetivo Ativo
  const [activeGoal, setActiveGoal] = useState<StudyGoal | null>(null);

  // Filtros & Busca
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');

  // Modais
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [materialsFilterGoalId, setMaterialsFilterGoalId] = useState<string | null>(null);
  const [isSummariesOpen, setIsSummariesOpen] = useState(false);
  const [summaryTargetGoal, setSummaryTargetGoal] = useState<StudyGoal | null>(null);
  const [summaryTargetFile, setSummaryTargetFile] = useState<StudyFile | null>(null);
  const [isGamificationOpen, setIsGamificationOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isVoiceLiveOpen, setIsVoiceLiveOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isTranscribeOpen, setIsTranscribeOpen] = useState(false);

  // Notificações
  const [notificationGranted, setNotificationGranted] = useState(
    notificationService.getPermission() === 'granted'
  );

  // Inicialização e Carga do Armazenamento
  useEffect(() => {
    const loadedGoals = storageService.getGoals();
    const loadedFiles = storageService.getFiles();
    const loadedSummaries = storageService.getSummaries();
    const loadedProfile = storageService.getProfile();

    setGoals(loadedGoals);
    setFiles(loadedFiles);
    setSummaries(loadedSummaries);
    setProfile(loadedProfile);

    // Se houver objetivos em progresso, sugerir o primeiro no Pomodoro
    const inProgress = loadedGoals.find(g => g.status === 'in_progress');
    if (inProgress) {
      setActiveGoal(inProgress);
    }
  }, []);

  // Efeito de Tema
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-amber');

    if (profile.themePreference === 'deep-dark') {
      root.classList.add('dark');
    } else if (profile.themePreference === 'warm-amber') {
      root.classList.add('theme-amber');
    }
  }, [profile.themePreference]);

  const handleThemeChange = (newTheme: 'cozy-light' | 'deep-dark' | 'warm-amber') => {
    const updated = { ...profile, themePreference: newTheme };
    setProfile(updated);
    storageService.saveProfile(updated);
  };

  // --- HANDLERS DE OBJETIVOS ---
  const handleSaveGoal = (goalData: {
    title: string;
    description: string;
    deadline: string;
    status: GoalStatus;
    priority: GoalPriority;
    category: GoalCategory;
    estimatedPomodoros: number;
  }) => {
    if (editingGoal) {
      const updated = storageService.updateGoal(editingGoal.id, goalData);
      if (updated) {
        setGoals(storageService.getGoals());
        setProfile(storageService.getProfile());
        if (activeGoal?.id === editingGoal.id) {
          setActiveGoal(updated);
        }
      }
    } else {
      const created = storageService.addGoal(goalData);
      setGoals(storageService.getGoals());
      setProfile(storageService.getProfile());
      // Conectar automaticamente ao Pomodoro se estiver vazio
      if (!activeGoal) {
        setActiveGoal(created);
      }
    }
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (window.confirm('Deseja realmente excluir este objetivo de estudo?')) {
      storageService.deleteGoal(goalId);
      setGoals(storageService.getGoals());
      if (activeGoal?.id === goalId) {
        setActiveGoal(null);
      }
    }
  };

  const handleToggleStatus = (goal: StudyGoal) => {
    const newStatus: GoalStatus = goal.status === 'completed' ? 'todo' : 'completed';
    storageService.updateGoal(goal.id, { status: newStatus });
    setGoals(storageService.getGoals());
    setProfile(storageService.getProfile());
    if (activeGoal?.id === goal.id && newStatus === 'completed') {
      setActiveGoal(null);
    }
  };

  // --- POMODORO COMPLETADO ---
  const handleSessionComplete = (
    durationMinutes: number, 
    mode: 'focus' | 'short_break' | 'long_break', 
    goalId?: string
  ) => {
    storageService.recordFocusSession({
      goalId,
      goalTitle: goals.find(g => g.id === goalId)?.title,
      durationMinutes,
      mode,
    });

    // Recarregar dados sincronizados
    setGoals(storageService.getGoals());
    setProfile(storageService.getProfile());

    if (mode === 'focus' && goalId) {
      const updatedGoal = storageService.getGoals().find(g => g.id === goalId);
      if (updatedGoal) setActiveGoal(updatedGoal);
    }
  };

  // --- PERMISSÃO DE NOTIFICAÇÃO ---
  const handleToggleNotification = async () => {
    if (notificationGranted) {
      alert('As notificações já estão ativadas no seu navegador!');
      return;
    }
    const granted = await notificationService.requestPermission();
    setNotificationGranted(granted);
    if (granted) {
      notificationService.notify('✨ Notificações do StudyRound Ativadas!', {
        body: 'Você receberá avisos gentis de fim de ciclo e lembretes para manter seu foco em dia.',
      });
    }
  };

  // --- FILTROS DE OBJETIVOS ---
  const filteredGoals = goals.filter(g => {
    const matchesSearch = 
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || g.category === categoryFilter;
    const matchesStatus = 
      statusFilter === 'all' || 
      g.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalGoals = goals.length;
  const completedCount = goals.filter(g => g.status === 'completed').length;
  const progressPercent = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;

  return (
    <div className={`min-h-screen transition-colors duration-200 font-sans flex flex-col ${
      profile.themePreference === 'deep-dark'
        ? 'bg-stone-950 text-stone-100'
        : profile.themePreference === 'warm-amber'
          ? 'bg-amber-50/50 text-stone-900'
          : 'bg-stone-50/70 text-stone-900'
    }`}>
      
      {/* Barra de Navegação Superior */}
      <Navbar
        profile={profile}
        theme={profile.themePreference}
        onThemeChange={handleThemeChange}
        onOpenNewGoal={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
        onOpenGamification={() => setIsGamificationOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenMaterials={() => { setMaterialsFilterGoalId(null); setIsMaterialsOpen(true); }}
        onOpenSummaries={() => { setSummaryTargetGoal(null); setSummaryTargetFile(null); setIsSummariesOpen(true); }}
        onToggleNotification={handleToggleNotification}
        notificationGranted={notificationGranted}
        onExportMenu={() => exportService.printOrSavePDF(goals, storageService.getSessions(), profile)}
        onOpenVoiceLive={() => setIsVoiceLiveOpen(true)}
        onOpenChatbot={() => setIsChatbotOpen(true)}
        onOpenTranscribe={() => setIsTranscribeOpen(true)}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">

        {/* Banner de Boas-Vindas & Atalhos Rápidos */}
        <div className="rounded-3xl p-6 sm:p-7 border bg-white dark:bg-stone-900 border-amber-900/10 dark:border-stone-800 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">☕</span>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
                  Bom dia de foco, {profile.name}!
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl leading-relaxed">
                Você já completou <strong>{completedCount} de {totalGoals} objetivos</strong>. Escolha um objetivo abaixo, ative o Pomodoro e conquiste mais XP hoje!
              </p>
            </div>

            {/* Ações Rápidas de IA, Resumo e Materiais */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  audioService.playClick();
                  setIsVoiceLiveOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-orange-500 text-white hover:bg-orange-600 text-xs font-bold transition shadow-xs active:scale-95"
                title="Conversar ao vivo por voz com o tutor de estudos"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Conversa por Voz (Live)</span>
              </button>

              <button
                onClick={() => {
                  audioService.playClick();
                  setIsChatbotOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-amber-100/90 dark:bg-stone-800 border border-amber-300/80 dark:border-stone-700 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-200/70 transition shadow-xs active:scale-95"
                title="Tirar dúvidas com o mentor e pesquisar na web"
              >
                <span>💬 Mentor Chat</span>
              </button>

              <button
                onClick={() => {
                  audioService.playClick();
                  setIsTranscribeOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-300 text-xs font-bold hover:bg-violet-100 transition shadow-xs active:scale-95"
                title="Gravar áudio e transcrever anotações"
              >
                <span>🎙️ Ditado de Voz</span>
              </button>

              <button
                onClick={() => {
                  audioService.playClick();
                  setSummaryTargetGoal(null);
                  setSummaryTargetFile(null);
                  setIsSummariesOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition shadow-xs active:scale-95"
              >
                <span>📄 Resumos & Quiz</span>
              </button>

              <button
                onClick={() => {
                  audioService.playClick();
                  setMaterialsFilterGoalId(null);
                  setIsMaterialsOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition shadow-xs active:scale-95"
              >
                <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Materiais ({files.length})</span>
              </button>
            </div>
          </div>

          {/* Barra de Progresso Geral Suave */}
          <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Progresso Geral das Metas:
              </span>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                {progressPercent}% concluído
              </span>
            </div>

            <div className="w-full sm:w-64 bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Componente Dica de Estudo do Dia com IA Gemini */}
        <DailyStudyTip
          goals={goals}
          studentName={profile.name}
          level={profile.level}
          streakDays={profile.streakDays}
          onFocusGoal={(goal) => {
            setActiveGoal(goal);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        {/* Layout em Duas Colunas: Timer Pomodoro à Esquerda + Objetivos à Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Coluna 1 (Timer de Foco Pomodoro) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-22">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Cronômetro Pomodoro</span>
              </h2>
              {activeGoal && (
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                  Vinculado à meta
                </span>
              )}
            </div>

            <PomodoroTimer
              activeGoal={activeGoal}
              onClearActiveGoal={() => setActiveGoal(null)}
              onSessionComplete={handleSessionComplete}
            />

            {/* Dica de foco abaixo do timer */}
            <div className="p-4 rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-white/60 dark:bg-stone-900/40 text-xs text-stone-600 dark:text-stone-400 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                <strong>Como funciona o Pomodoro:</strong> Estude 25 minutos com foco total. Quando o alarme tocar, faça 5 minutos de pausa. A cada 4 blocos, descanse 15 minutos!
              </p>
            </div>
          </div>

          {/* Coluna 2 (Mural de Objetivos de Estudo) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Barra de Filtros e Busca de Objetivos */}
            <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar objetivos ou matérias..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Filtro por Categoria */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden"
              >
                <option value="Todas">Todas as Matérias</option>
                <option value="Matemática">Matemática</option>
                <option value="Linguagens">Linguagens</option>
                <option value="Ciências">Ciências</option>
                <option value="Humanas">Humanas</option>
                <option value="Programação">Programação</option>
                <option value="Concursos">Concursos</option>
                <option value="Idiomas">Idiomas</option>
                <option value="Geral">Geral</option>
              </select>

              {/* Filtro por Status */}
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setStatusFilter('todo')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    statusFilter === 'todo'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  A Fazer
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    statusFilter === 'completed'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Concluídas
                </button>
              </div>

            </div>

            {/* Cabeçalho da Lista & Botão Criar */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                Mostrando {filteredGoals.length} {filteredGoals.length === 1 ? 'objetivo' : 'objetivos'}
              </span>

              <button
                onClick={() => {
                  audioService.playClick();
                  setEditingGoal(null);
                  setIsGoalModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Objetivo</span>
              </button>
            </div>

            {/* Lista de Cartões ou Estado Vazio */}
            {filteredGoals.length === 0 ? (
              <EmptyState
                onOpenNewGoal={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
                onRestoreExamples={() => {
                  const exampleGoals = storageService.getGoals();
                  if (exampleGoals.length === 0) {
                    storageService.addGoal({
                      title: 'Revisar Fórmulas de Física e Termodinâmica',
                      description: 'Resolver 5 questões de conservação de energia e ciclo de Carnot.',
                      deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                      status: 'todo',
                      priority: 'alta',
                      category: 'Ciências',
                      estimatedPomodoros: 3,
                    });
                  }
                  setGoals(storageService.getGoals());
                  setCategoryFilter('Todas');
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                isFiltered={searchTerm !== '' || categoryFilter !== 'Todas' || statusFilter !== 'all'}
                onClearFilter={() => {
                  setSearchTerm('');
                  setCategoryFilter('Todas');
                  setStatusFilter('all');
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    isActiveInPomodoro={activeGoal?.id === goal.id}
                    onStartPomodoro={(g) => {
                      setActiveGoal(g);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onEdit={(g) => {
                      setEditingGoal(g);
                      setIsGoalModalOpen(true);
                    }}
                    onDelete={handleDeleteGoal}
                    onToggleStatus={handleToggleStatus}
                    onOpenMaterialsForGoal={(gId) => {
                      setMaterialsFilterGoalId(gId);
                      setIsMaterialsOpen(true);
                    }}
                    onOpenSummaryForGoal={(g) => {
                      setSummaryTargetGoal(g);
                      setSummaryTargetFile(null);
                      setIsSummariesOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

          </div>

        </div>

      </main>

      {/* Rodapé Aconchegante */}
      <footer className="mt-12 py-6 border-t border-stone-200 dark:border-stone-800 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-stone-700 dark:text-stone-300">StudyRound</span>
            <span>•</span>
            <span>Plataforma Gamificada de Aprendizagem & Foco</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => exportService.exportGoalsToCSV(goals, profile)}
              className="hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>
            <button
              onClick={() => exportService.printOrSavePDF(goals, storageService.getSessions(), profile)}
              className="hover:underline"
            >
              Imprimir Relatório (PDF)
            </button>
            <button
              onClick={() => setIsGamificationOpen(true)}
              className="hover:underline flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" /> {profile.streakDays} Dias de Sequência
            </button>
          </div>
        </div>
      </footer>

      {/* --- MODAIS DO SISTEMA --- */}
      
      {/* 1. Modal de Criação / Edição de Objetivo */}
      <GoalFormModal
        isOpen={isGoalModalOpen}
        onClose={() => { setIsGoalModalOpen(false); setEditingGoal(null); }}
        onSubmit={handleSaveGoal}
        initialGoal={editingGoal}
      />

      {/* 2. Modal de Upload e Materiais de Estudo */}
      <StudyMaterialsModal
        isOpen={isMaterialsOpen}
        onClose={() => { setIsMaterialsOpen(false); setMaterialsFilterGoalId(null); }}
        files={files}
        goals={goals}
        onUploadFile={(fileData) => {
          const created = storageService.addFile(fileData);
          setFiles(storageService.getFiles());
          setGoals(storageService.getGoals());
          setProfile(storageService.getProfile());
        }}
        onDeleteFile={(id) => {
          storageService.deleteFile(id);
          setFiles(storageService.getFiles());
          setGoals(storageService.getGoals());
        }}
        onOpenSummaryForFile={(file) => {
          setSummaryTargetFile(file);
          setSummaryTargetGoal(null);
          setIsSummariesOpen(true);
        }}
        filterGoalId={materialsFilterGoalId}
      />

      {/* 3. Modal de Ferramentas de Resumo, Flashcards e Sínteses */}
      <SummaryToolsModal
        isOpen={isSummariesOpen}
        onClose={() => { setIsSummariesOpen(false); setSummaryTargetGoal(null); setSummaryTargetFile(null); }}
        goals={goals}
        files={files}
        initialGoal={summaryTargetGoal}
        initialFile={summaryTargetFile}
        onSaveSummary={(summaryData) => {
          storageService.addSummary(summaryData);
          setSummaries(storageService.getSummaries());
          setProfile(storageService.getProfile());
        }}
        savedSummaries={summaries}
        onDeleteSummary={(id) => {
          storageService.deleteSummary(id);
          setSummaries(storageService.getSummaries());
        }}
      />

      {/* 4. Modal de Gamificação, Níveis e Conquistas */}
      <GamificationModal
        isOpen={isGamificationOpen}
        onClose={() => setIsGamificationOpen(false)}
        profile={profile}
        badges={storageService.getBadges()}
        onSelectAvatar={(avatar) => {
          const updated = { ...profile, avatarIcon: avatar };
          setProfile(updated);
          storageService.saveProfile(updated);
        }}
      />

      {/* 5. Modal de Estatísticas e Desempenho */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        goals={goals}
        sessions={storageService.getSessions()}
        profile={profile}
        onExportCSV={() => exportService.exportGoalsToCSV(goals, profile)}
        onExportPDF={() => exportService.printOrSavePDF(goals, storageService.getSessions(), profile)}
      />

      {/* 6. Modal de Conversa por Voz em Tempo Real (Gemini 3.8 Live) */}
      <VoiceConversationModal
        isOpen={isVoiceLiveOpen}
        onClose={() => setIsVoiceLiveOpen(false)}
        studentName={profile.name}
      />

      {/* 7. Modal de Chatbot Mentor com Google Search Grounding (Gemini 3.8 Flash) */}
      <GeminiChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        goals={goals}
        studentName={profile.name}
      />

      {/* 8. Modal de Transcrição de Áudio e Ditado (Gemini 3.5 Transcribe) */}
      <AudioTranscriberModal
        isOpen={isTranscribeOpen}
        onClose={() => setIsTranscribeOpen(false)}
        onCreateGoalWithText={(text) => {
          storageService.addGoal({
            title: text.slice(0, 45) + (text.length > 45 ? '...' : ''),
            description: text,
            deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            status: 'todo',
            priority: 'media',
            category: 'Geral',
            estimatedPomodoros: 2,
          });
          setGoals(storageService.getGoals());
          setProfile(storageService.getProfile());
        }}
        onSummarizeText={(text) => {
          setSummaryTargetFile({
            id: 'transcribed_' + Date.now(),
            name: 'Ditado de Voz / Transcrição',
            size: text.length,
            type: 'text/plain',
            uploadedAt: new Date().toISOString(),
            textContent: text,
          });
          setIsSummariesOpen(true);
        }}
      />

    </div>
  );
}
