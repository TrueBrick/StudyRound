// Serviço de notificações no navegador (Web Notifications API)

export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Erro ao pedir permissão de notificação:', e);
      return false;
    }
  },

  notify(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const notif = new Notification(title, {
        icon: 'https://api.iconify.design/lucide:book-open-check.svg',
        badge: 'https://api.iconify.design/lucide:timer.svg',
        silent: false,
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return true;
    } catch (e) {
      console.warn('Erro ao disparar notificação:', e);
      return false;
    }
  },

  notifyPomodoroComplete(mode: 'focus' | 'short_break' | 'long_break', goalTitle?: string): void {
    if (mode === 'focus') {
      this.notify('🎉 Sessão de Foco Concluída!', {
        body: goalTitle 
          ? `Excelente trabalho em "${goalTitle}"! Hora de uma pausa merecida de 5 minutos.` 
          : 'Excelente rodada de foco! Respire fundo e faça uma pausa de 5 minutos.',
      });
    } else {
      this.notify('☕ Pausa Finalizada!', {
        body: 'Sua energia foi recarregada. Pronto para mais um round de estudos produtivos?',
      });
    }
  },

  notifyStudyReminder(goalTitle: string): void {
    this.notify('🌱 Hora de retomar seus estudos!', {
      body: `Seu objetivo "${goalTitle}" está aguardando você para um ciclo de foco.`,
    });
  }
};
