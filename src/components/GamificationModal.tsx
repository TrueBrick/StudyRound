import React from 'react';
import { X, Trophy, Flame, Award, Sparkles, Check, Lock } from 'lucide-react';
import { UserProfile, Badge } from '../types/study';
import { audioService } from '../services/audioService';

interface GamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  badges: Badge[];
  onSelectAvatar: (avatarIcon: string) => void;
}

const AVATARS = [
  { icon: '🦊', name: 'Raposa Focada', cost: 0 },
  { icon: '🦉', name: 'Coruja Sábia', cost: 20 },
  { icon: '☕', name: 'Café & Livros', cost: 30 },
  { icon: '🐼', name: 'Panda Zen', cost: 40 },
  { icon: '🐱', name: 'Gato Curioso', cost: 50 },
  { icon: '🦁', name: 'Leão Destemido', cost: 60 },
  { icon: '🚀', name: 'Astronauta do Foco', cost: 80 },
];

export const GamificationModal: React.FC<GamificationModalProps> = ({
  isOpen,
  onClose,
  profile,
  badges,
  onSelectAvatar,
}) => {
  if (!isOpen) return null;

  const xpNeeded = profile.level * 150;
  const progressPercent = Math.min(100, Math.round((profile.xp / xpNeeded) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-amber-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                Recompensas & Conquistas
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Seu progresso diário reconhecido e recompensado
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

          {/* Cartão de Nível e Streak */}
          <div className="p-5 rounded-3xl bg-linear-to-br from-amber-50 to-orange-50 dark:from-stone-800 dark:to-stone-800/60 border border-amber-200/80 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-5">
            
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="text-5xl p-3 bg-white dark:bg-stone-900 rounded-2xl shadow-xs border border-amber-200/60 dark:border-stone-700">
                {profile.avatarIcon || '🦊'}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-200/60 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                  Nível {profile.level} • {profile.level < 3 ? 'Iniciante Focado' : profile.level < 7 ? 'Estudante Consistente' : 'Mestre do Conhecimento'}
                </span>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                  {profile.name}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {profile.totalMinutesFocused} minutos totais de foco pleno
                </p>
              </div>
            </div>

            {/* Streak & Coins */}
            <div className="flex items-center gap-3">
              <div className="text-center p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 min-w-22">
                <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400 font-extrabold text-lg">
                  <Flame className="w-5 h-5" />
                  <span>{profile.streakDays}</span>
                </div>
                <div className="text-[10px] uppercase font-bold text-stone-400 mt-0.5">Dias Seguidos</div>
              </div>

              <div className="text-center p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 min-w-22">
                <div className="text-amber-600 dark:text-amber-400 font-extrabold text-lg">
                  🪙 {profile.studyCoins}
                </div>
                <div className="text-[10px] uppercase font-bold text-stone-400 mt-0.5">StudyCoins</div>
              </div>
            </div>

          </div>

          {/* Barra de Progresso do Próximo Nível */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
              <span>Experiência para Nível {profile.level + 1}</span>
              <span>{profile.xp} / {xpNeeded} XP ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200 dark:border-stone-700">
              <div 
                className="bg-linear-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Vitrine de Conquistas (Badges) */}
          <div>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Conquistas e Medalhas ({badges.filter(b => b.unlocked).length}/{badges.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map(b => (
                <div 
                  key={b.id}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition ${
                    b.unlocked
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/60 shadow-xs'
                      : 'bg-stone-50/40 dark:bg-stone-800/30 border-stone-200 dark:border-stone-800 opacity-60'
                  }`}
                >
                  <div className="text-3xl p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xs">
                    {b.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {b.title}
                      </h4>
                      {b.unlocked ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Conquistado</span>
                      ) : (
                        <Lock className="w-3 h-3 text-stone-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                      {b.description}
                    </p>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      Meta: {b.requirement}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seleção de Mascote / Avatar com StudyCoins */}
          <div>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Mascotes de Estudo (Desbloqueie com StudyCoins)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {AVATARS.map(avatar => {
                const isSelected = profile.avatarIcon === avatar.icon;
                const canAfford = profile.studyCoins >= avatar.cost;

                return (
                  <button
                    key={avatar.name}
                    onClick={() => {
                      if (isSelected) return;
                      if (canAfford) {
                        audioService.playTaskSuccess();
                        onSelectAvatar(avatar.icon);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-2 ring-amber-400/20'
                        : canAfford
                          ? 'border-stone-200 dark:border-stone-700 hover:border-amber-400 bg-white dark:bg-stone-800'
                          : 'border-stone-200 dark:border-stone-800 opacity-50 cursor-not-allowed bg-stone-50 dark:bg-stone-900'
                    }`}
                  >
                    <span className="text-3xl mb-1">{avatar.icon}</span>
                    <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 truncate w-full">
                      {avatar.name}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
                      {isSelected ? '✓ Em uso' : avatar.cost === 0 ? 'Grátis' : `🪙 ${avatar.cost}`}
                    </span>
                  </button>
                );
              })}
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
