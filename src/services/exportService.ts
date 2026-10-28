import { StudyGoal, FocusSession, UserProfile } from '../types/study';

export const exportService = {
  // Exportar objetivos e desempenho para CSV formatado em Português
  exportGoalsToCSV(goals: StudyGoal[], profile: UserProfile): void {
    const headers = [
      'ID',
      'Título do Objetivo',
      'Categoria',
      'Prioridade',
      'Status',
      'Prazo',
      'Pomodoros Estimados',
      'Pomodoros Concluídos',
      'Minutos Focados',
      'Data de Criação',
      'Data de Conclusão'
    ];

    const rows = goals.map(g => [
      `"${g.id}"`,
      `"${g.title.replace(/"/g, '""')}"`,
      `"${g.category}"`,
      `"${g.priority}"`,
      `"${g.status === 'completed' ? 'Concluído' : g.status === 'in_progress' ? 'Em Progresso' : 'A Fazer'}"`,
      `"${g.deadline || 'Sem prazo'}"`,
      g.estimatedPomodoros,
      g.completedPomodoros,
      g.totalFocusMinutes,
      `"${new Date(g.createdAt).toLocaleDateString('pt-BR')}"`,
      g.completedAt ? `"${new Date(g.completedAt).toLocaleDateString('pt-BR')}"` : '""'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studyround-objetivos-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Exportar relatório diagramado pronto para impressão / Salvar em PDF
  printOrSavePDF(goals: StudyGoal[], sessions: FocusSession[], profile: UserProfile): void {
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Estudos - StudyRound</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #2d3748; padding: 40px; margin: 0; background: #fff; line-height: 1.5; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 24px; font-weight: bold; color: #b45309; }
          .badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-size: 13px; font-weight: bold; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
          .stat-val { font-size: 22px; font-weight: bold; color: #1e293b; margin-top: 5px; }
          .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; color: #475569; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .tag { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .tag-done { background: #dcfce7; color: #15803d; }
          .tag-prog { background: #fef9c3; color: #854d0e; }
          .tag-todo { background: #e0f2fe; color: #0369a1; }
          @media print {
            body { padding: 10px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">StudyRound ☕ Relatório de Desempenho</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Gerado em ${new Date().toLocaleDateString('pt-BR')} para ${profile.name}</div>
          </div>
          <div class="badge">Nível ${profile.level} • ${profile.streakDays} Dias de Sequência 🔥</div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total de Objetivos</div>
            <div class="stat-val">${goals.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Metas Concluídas</div>
            <div class="stat-val">${completedGoals}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Minutos Focados</div>
            <div class="stat-val">${profile.totalMinutesFocused} min</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">StudyCoins Acumulados</div>
            <div class="stat-val">🪙 ${profile.studyCoins}</div>
          </div>
        </div>

        <h3 style="margin-bottom: 5px; color: #334155;">Objetivos de Estudo Cadastrados</h3>
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoria</th>
              <th>Prazo</th>
              <th>Progresso Pomodoro</th>
              <th>Minutos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${goals.map(g => `
              <tr>
                <td><strong>${g.title}</strong><br><span style="color:#64748b; font-size:11px;">${g.description || '-'}</span></td>
                <td>${g.category}</td>
                <td>${g.deadline || 'A definir'}</td>
                <td>${g.completedPomodoros} / ${g.estimatedPomodoros}</td>
                <td>${g.totalFocusMinutes} min</td>
                <td>
                  <span class="tag ${g.status === 'completed' ? 'tag-done' : g.status === 'in_progress' ? 'tag-prog' : 'tag-todo'}">
                    ${g.status === 'completed' ? 'Concluído' : g.status === 'in_progress' ? 'Em Progresso' : 'A Fazer'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8;">
          StudyRound • Plataforma Gamificada de Foco e Aprendizado Contínuo
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
