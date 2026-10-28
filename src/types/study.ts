export type GoalStatus = 'todo' | 'in_progress' | 'completed';

export type GoalPriority = 'baixa' | 'media' | 'alta';

export type GoalCategory = 
  | 'Geral' 
  | 'Matemática' 
  | 'Linguagens' 
  | 'Ciências' 
  | 'Humanas' 
  | 'Programação' 
  | 'Concursos' 
  | 'Idiomas';

export interface StudyFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl?: string; // Para imagens ou visualização
  textContent?: string; // Texto extraído para resumo
  goalId?: string; // Vinculado a um objetivo específico ou geral
  notes?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userAnswer?: number;
}

export interface StudySummary {
  id: string;
  title: string;
  sourceFileName?: string;
  goalId?: string;
  createdAt: string;
  overview: string;
  keyPoints: string[];
  concepts: { term: string; definition: string }[];
  takeaways: string;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
}

export interface StudyGoal {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO string ou YYYY-MM-DD
  status: GoalStatus;
  priority: GoalPriority;
  category: GoalCategory;
  estimatedPomodoros: number;
  completedPomodoros: number;
  totalFocusMinutes: number;
  createdAt: string;
  completedAt?: string;
  attachedFileIds: string[];
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  studyCoins: number;
  streakDays: number;
  lastStudyDate: string; // YYYY-MM-DD
  totalMinutesFocused: number;
  totalCompletedGoals: number;
  avatarIcon: string;
  themePreference: 'cozy-light' | 'deep-dark' | 'warm-amber';
  unlockedBadgeIds: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface FocusSession {
  id: string;
  goalId?: string;
  goalTitle?: string;
  durationMinutes: number;
  completedAt: string;
  mode: 'focus' | 'short_break' | 'long_break';
}
