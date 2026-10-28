import { StudySummary, Flashcard, QuizQuestion } from '../types/study';

export const summaryService = {
  // Extrai texto de arquivos carregados (suporte a .txt, .md, .json, .csv ou leitura direta)
  async extractTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Se for arquivo de texto
      if (
        file.type.includes('text') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.csv')
      ) {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, 'UTF-8');
      } else if (file.type.includes('pdf')) {
        // Para PDFs no cliente, geramos a extração de metadados legíveis
        resolve(`[Documento PDF: ${file.name}] (${(file.size / 1024).toFixed(1)} KB) - Material anexado para estudo e revisão de tópicos.`);
      } else {
        resolve(`[Arquivo: ${file.name}] - Conteúdo de suporte anexado aos seus objetivos.`);
      }
    });
  },

  // Gera resumo estruturado com base no texto fornecido
  generateStructuredSummary(
    text: string, 
    title: string, 
    sourceFileName?: string, 
    goalId?: string
  ): Omit<StudySummary, 'id' | 'createdAt'> {
    const cleanText = text.trim();
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    const paragraphs = cleanText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Heurística de extração de pontos-chave
    const keyPoints: string[] = [];
    if (sentences.length > 0) {
      // Priorizar frases que contenham conectores de relevância ou definições
      const importantKeywords = ['importante', 'fundamental', 'portanto', 'conceito', 'define-se', 'principal', 'objetivo', 'método', 'regra', 'fórmula', 'resultado', 'primeiro', 'exemplo'];
      const prioritized = sentences.filter(s => 
        importantKeywords.some(k => s.toLowerCase().includes(k))
      );

      const candidates = prioritized.length >= 3 ? prioritized : sentences;
      // Pegar até 5 pontos principais
      candidates.slice(0, 5).forEach(c => {
        keyPoints.push(c.charAt(0).toUpperCase() + c.slice(1));
      });
    }

    if (keyPoints.length === 0) {
      keyPoints.push('Foco na assimilação gradual do conteúdo estudado.');
      keyPoints.push('Identificação de termos técnicos e aplicações práticas.');
      keyPoints.push('Revisão ativa através dos flashcards gerados.');
    }

    // Conceitos e Glossário
    const concepts: { term: string; definition: string }[] = [];
    // Busca por padrões "X é Y", "X: Y" ou "X significa Y"
    const lines = cleanText.split('\n');
    lines.forEach(line => {
      const colonMatch = line.match(/^([A-Za-zÀ-ÿ0-9\s]{3,30}):\s*(.+)$/);
      if (colonMatch && concepts.length < 4) {
        concepts.push({
          term: colonMatch[1].trim(),
          definition: colonMatch[2].trim(),
        });
      }
    });

    if (concepts.length === 0) {
      concepts.push({
        term: 'Fundamento Central',
        definition: sentences[0] || 'Base teórica para resolução das tarefas deste objetivo.',
      });
      concepts.push({
        term: 'Aplicação Prática',
        definition: sentences[1] || 'Como aplicar o conhecimento adquirido em exercícios ou projetos.',
      });
    }

    // Visão Geral (Overview)
    const overview = paragraphs[0] 
      ? (paragraphs[0].slice(0, 280) + (paragraphs[0].length > 280 ? '...' : ''))
      : `Síntese e sistematização de tópicos para o tema "${title}". O material apresenta fundamentos e conceitos que auxiliam na compreensão do conteúdo.`;

    const takeaways = paragraphs.length > 1 
      ? paragraphs[paragraphs.length - 1].slice(0, 220)
      : 'Para fixação duradoura, alterne blocos de foco Pomodoro com a repetição espaçada dos cartões de memória abaixo.';

    // Gerar Flashcards automáticos
    const flashcards: Flashcard[] = [];
    concepts.forEach((c, idx) => {
      flashcards.push({
        id: 'fc_' + idx + '_' + Date.now(),
        front: `O que é ou como se define: "${c.term}"?`,
        back: c.definition,
        mastered: false,
      });
    });

    if (keyPoints.length > 0) {
      flashcards.push({
        id: 'fc_kp_' + Date.now(),
        front: `Qual é o ponto central sobre "${title}"?`,
        back: keyPoints[0],
        mastered: false,
      });
    }

    // Gerar Quiz de Fixação
    const quiz: QuizQuestion[] = [
      {
        id: 'qz_1_' + Date.now(),
        question: `Considerando o estudo de "${title}", qual é uma das premissas fundamentais?`,
        options: [
          keyPoints[0] || 'Compreensão contextualizada dos tópicos.',
          'Memorização superficial sem aplicação prática.',
          'Estudo sem pausas ou sem cronometragens.',
          'Nenhuma das alternativas anteriores.'
        ],
        correctIndex: 0,
        explanation: 'O estudo estruturado prioriza a assimilação ativa e clareza sobre os pontos centrais.',
      },
      {
        id: 'qz_2_' + Date.now(),
        question: `Como o conceito "${concepts[0]?.term || 'Tópico Principal'}" deve ser aplicado?`,
        options: [
          'Ignorando o contexto e focando apenas em decoreba.',
          concepts[0]?.definition.slice(0, 70) || 'Revisando seus fundamentos e testando em exercícios.',
          'Adiando a revisão para a véspera do teste.',
          'Substituindo o foco contínuo por multitarefa.'
        ],
        correctIndex: 1,
        explanation: 'Fixar conceitos exige relacionamento com a definição correta e prática reiterada.',
      }
    ];

    return {
      title,
      sourceFileName,
      goalId,
      overview,
      keyPoints,
      concepts,
      takeaways,
      flashcards,
      quiz,
    };
  }
};
