import { StudyGoal, StudyFile, StudySummary, UserProfile, FocusSession, Badge } from '../types/study';

const STORAGE_KEYS = {
  GOALS: 'studyround_goals_v1',
  FILES: 'studyround_files_v1',
  SUMMARIES: 'studyround_summaries_v1',
  PROFILE: 'studyround_profile_v1',
  SESSIONS: 'studyround_sessions_v1',
};

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_goal',
    title: 'Primeiro Passo',
    description: 'Cadastrou o seu primeiro objetivo no StudyRound.',
    icon: '🌱',
    requirement: 'Crie 1 objetivo',
    unlocked: false,
  },
  {
    id: 'first_pomodoro',
    title: 'Foco Inicial',
    description: 'Completou seu primeiro ciclo de Pomodoro.',
    icon: '⏱️',
    requirement: 'Conclua 1 sessão de foco',
    unlocked: false,
  },
  {
    id: 'streak_3',
    title: 'Constância de Ouro',
    description: 'Manteve 3 dias seguidos de dedicação aos estudos.',
    icon: '🔥',
    requirement: 'Atinja 3 dias de streak',
    unlocked: false,
  },
  {
    id: 'summary_master',
    title: 'Mente Sintética',
    description: 'Criou seu primeiro resumo estruturado com material de estudo.',
    icon: '📑',
    requirement: 'Gere 1 resumo ou flashcards',
    unlocked: false,
  },
  {
    id: 'goal_slayer',
    title: 'Missão Cumprida',
    description: 'Concluiu com sucesso seu primeiro objetivo de estudo.',
    icon: '🏆',
    requirement: 'Conclua 1 objetivo',
    unlocked: false,
  },
  {
    id: 'cozy_night',
    title: 'Estudo Aconchegante',
    description: 'Acumulou mais de 60 minutos de estudo com foco pleno.',
    icon: '☕',
    requirement: 'Atinja 60 minutos de foco total',
    unlocked: false,
  },
];

const DEFAULT_PROFILE: UserProfile = {
  name: 'Estudante',
  level: 1,
  xp: 120,
  studyCoins: 30,
  streakDays: 1,
  lastStudyDate: new Date().toISOString().split('T')[0],
  totalMinutesFocused: 25,
  totalCompletedGoals: 0,
  avatarIcon: '🦊',
  themePreference: 'cozy-light',
  unlockedBadgeIds: ['first_goal'],
};

const DEFAULT_GOALS: StudyGoal[] = [
  {
    id: 'demo_goal_1',
    title: 'Dominar Princípios de Neurociência da Aprendizagem',
    description: 'Ler o artigo sobre repetição espaçada e praticar 2 blocos de foco para consolidar o método Feynman.',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'in_progress',
    priority: 'alta',
    category: 'Ciências',
    estimatedPomodoros: 4,
    completedPomodoros: 1,
    totalFocusMinutes: 25,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    attachedFileIds: [],
  },
  {
    id: 'demo_goal_2',
    title: 'Resumo e Exercícios de Funções e Trigonometria',
    description: 'Fazer síntese com fórmulas essenciais e resolver a lista de 10 questões preparatórias.',
    deadline: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    status: 'todo',
    priority: 'media',
    category: 'Matemática',
    estimatedPomodoros: 3,
    completedPomodoros: 0,
    totalFocusMinutes: 0,
    createdAt: new Date().toISOString(),
    attachedFileIds: [],
  },
];

export const storageService = {
  // --- OBJETIVOS (GOALS) ---
  getGoals(): StudyGoal[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (!data) {
        this.saveGoals(DEFAULT_GOALS);
        return DEFAULT_GOALS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao carregar objetivos:', e);
      return DEFAULT_GOALS;
    }
  },

  saveGoals(goals: StudyGoal[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('Erro ao salvar objetivos:', e);
    }
  },

  addGoal(goalData: Omit<StudyGoal, 'id' | 'createdAt' | 'completedPomodoros' | 'totalFocusMinutes' | 'attachedFileIds'>): StudyGoal {
    const goals = this.getGoals();
    const newGoal: StudyGoal = {
      ...goalData,
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      completedPomodoros: 0,
      totalFocusMinutes: 0,
      attachedFileIds: [],
      createdAt: new Date().toISOString(),
    };
    goals.unshift(newGoal);
    this.saveGoals(goals);

    // Conceder XP por planejar
    this.addRewardPoints(20, 5);
    this.unlockBadge('first_goal');

    return newGoal;
  },

  updateGoal(id: string, updates: Partial<StudyGoal>): StudyGoal | null {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) return null;

    const currentGoal = goals[index];
    const isBecomingCompleted = updates.status === 'completed' && currentGoal.status !== 'completed';

    const updatedGoal: StudyGoal = {
      ...currentGoal,
      ...updates,
      completedAt: isBecomingCompleted ? new Date().toISOString() : currentGoal.completedAt,
    };

    goals[index] = updatedGoal;
    this.saveGoals(goals);

    if (isBecomingCompleted) {
      this.addRewardPoints(100, 25);
      this.unlockBadge('goal_slayer');
      const profile = this.getProfile();
      profile.totalCompletedGoals = (profile.totalCompletedGoals || 0) + 1;
      this.saveProfile(profile);
    }

    return updatedGoal;
  },

  deleteGoal(id: string): boolean {
    const goals = this.getGoals();
    const filtered = goals.filter(g => g.id !== id);
    if (filtered.length !== goals.length) {
      this.saveGoals(filtered);
      return true;
    }
    return false;
  },

  incrementGoalFocusTime(goalId: string, minutes: number): void {
    const goals = this.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      goal.totalFocusMinutes = (goal.totalFocusMinutes || 0) + minutes;
      goal.completedPomodoros = (goal.completedPomodoros || 0) + 1;
      if (goal.status === 'todo') {
        goal.status = 'in_progress';
      }
      this.saveGoals(goals);
    }
  },

  // --- ARQUIVOS DE ESTUDO (STUDY FILES) ---
  getFiles(): StudyFile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FILES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Erro ao carregar arquivos:', e);
      return [];
    }
  },

  saveFiles(files: StudyFile[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
    } catch (e) {
      console.error('Erro ao salvar arquivos:', e);
    }
  },

  addFile(file: Omit<StudyFile, 'id' | 'uploadedAt'>): StudyFile {
    const files = this.getFiles();
    const newFile: StudyFile = {
      ...file,
      id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      uploadedAt: new Date().toISOString(),
    };
    files.unshift(newFile);
    this.saveFiles(files);

    // Vincular ao objetivo se especificado
    if (newFile.goalId) {
      const goals = this.getGoals();
      const goal = goals.find(g => g.id === newFile.goalId);
      if (goal) {
        if (!goal.attachedFileIds) goal.attachedFileIds = [];
        if (!goal.attachedFileIds.includes(newFile.id)) {
          goal.attachedFileIds.push(newFile.id);
          this.saveGoals(goals);
        }
      }
    }

    this.addRewardPoints(15, 5);
    return newFile;
  },

  deleteFile(id: string): void {
    const files = this.getFiles().filter(f => f.id !== id);
    this.saveFiles(files);

    // Remover referência nos objetivos
    const goals = this.getGoals();
    let changed = false;
    goals.forEach(g => {
      if (g.attachedFileIds && g.attachedFileIds.includes(id)) {
        g.attachedFileIds = g.attachedFileIds.filter(fId => fId !== id);
        changed = true;
      }
    });
    if (changed) this.saveGoals(goals);
  },

  // --- RESUMOS E FERRAMENTAS DE SÍNTESE ---
  getSummaries(): StudySummary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Erro ao carregar resumos:', e);
      return [];
    }
  },

  saveSummaries(summaries: StudySummary[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));
    } catch (e) {
      console.error('Erro ao salvar resumos:', e);
    }
  },

  addSummary(summary: Omit<StudySummary, 'id' | 'createdAt'>): StudySummary {
    const summaries = this.getSummaries();
    const newSummary: StudySummary = {
      ...summary,
      id: 'sum_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    summaries.unshift(newSummary);
    this.saveSummaries(summaries);

    this.addRewardPoints(40, 15);
    this.unlockBadge('summary_master');
    return newSummary;
  },

  deleteSummary(id: string): void {
    const summaries = this.getSummaries().filter(s => s.id !== id);
    this.saveSummaries(summaries);
  },

  // --- PERFIL DO USUÁRIO & GAMIFICAÇÃO ---
  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!data) {
        this.saveProfile(DEFAULT_PROFILE);
        return DEFAULT_PROFILE;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Erro ao carregar perfil:', e);
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Erro ao salvar perfil:', e);
    }
  },

  addRewardPoints(xpToAdd: number, coinsToAdd: number = 0): { leveledUp: boolean; newLevel: number } {
    const profile = this.getProfile();
    profile.xp += xpToAdd;
    profile.studyCoins += coinsToAdd;

    // Cada nível necessita de (nível * 150) XP
    let leveledUp = false;
    let requiredXpForNext = profile.level * 150;
    while (profile.xp >= requiredXpForNext) {
      profile.xp -= requiredXpForNext;
      profile.level += 1;
      profile.studyCoins += 20; // Bônus por level up
      leveledUp = true;
      requiredXpForNext = profile.level * 150;
    }

    this.saveProfile(profile);
    return { leveledUp, newLevel: profile.level };
  },

  recordFocusSession(session: Omit<FocusSession, 'id' | 'completedAt'>): void {
    const sessions = this.getSessions();
    const newSession: FocusSession = {
      ...session,
      id: 'sess_' + Date.now(),
      completedAt: new Date().toISOString(),
    };
    sessions.unshift(newSession);
    this.saveSessions(sessions);

    // Atualizar perfil
    const profile = this.getProfile();
    const today = new Date().toISOString().split('T')[0];

    profile.totalMinutesFocused += session.durationMinutes;

    // Calcular Streak
    if (session.mode === 'focus') {
      if (profile.lastStudyDate !== today) {
        const lastDate = new Date(profile.lastStudyDate);
        const currDate = new Date(today);
        const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          profile.streakDays += 1;
        } else if (diffDays > 1) {
          profile.streakDays = 1;
        }
        profile.lastStudyDate = today;
      }

      if (profile.streakDays >= 3) {
        this.unlockBadge('streak_3');
      }

      if (profile.totalMinutesFocused >= 60) {
        this.unlockBadge('cozy_night');
      }

      this.unlockBadge('first_pomodoro');
    }

    this.saveProfile(profile);

    // Se vinculado a um objetivo, computar
    if (session.goalId && session.mode === 'focus') {
      this.incrementGoalFocusTime(session.goalId, session.durationMinutes);
    }

    // Ganho de XP proporcional: 10 XP por minuto de foco
    this.addRewardPoints(session.durationMinutes * 10, Math.floor(session.durationMinutes / 5));
  },

  getSessions(): FocusSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveSessions(sessions: FocusSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error(e);
    }
  },

  unlockBadge(badgeId: string): boolean {
    const profile = this.getProfile();
    if (!profile.unlockedBadgeIds) {
      profile.unlockedBadgeIds = [];
    }
    if (!profile.unlockedBadgeIds.includes(badgeId)) {
      profile.unlockedBadgeIds.push(badgeId);
      this.saveProfile(profile);
      return true;
    }
    return false;
  },

  getBadges(): Badge[] {
    const profile = this.getProfile();
    return INITIAL_BADGES.map(b => ({
      ...b,
      unlocked: profile.unlockedBadgeIds ? profile.unlockedBadgeIds.includes(b.id) : false,
    }));
  },
};
