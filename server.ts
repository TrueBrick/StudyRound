import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, type WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Inicialização do cliente Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. ENDPOINT: Dica de Estudo Personalizada via Gemini 3.8 Flash
app.post('/api/study-tip', async (req, res) => {
  try {
    const { goals = [], studentName = 'Estudante', level = 1, streakDays = 1 } = req.body;
    const openGoals = goals.filter((g: any) => g.status !== 'completed');

    const goalsSummary = openGoals.length > 0 
      ? openGoals.map((g: any, i: number) => 
          `${i + 1}. [${g.category}] ${g.title} (Prioridade: ${g.priority || 'média'}, Prazo: ${g.deadline || 'sem prazo'}, Feitos: ${g.completedPomodoros || 0}/${g.estimatedPomodoros || 2} pomodoros)`
        ).join('\n')
      : 'Nenhum objetivo cadastrado no momento. O estudante está iniciando.';

    const prompt = `Você é o mentor pedagógico do StudyRound, uma plataforma acolhedora e gamificada de estudos.
O estudante "${studentName}" está no Nível ${level} com uma sequência de ${streakDays} dias de estudo.

Objetivos em aberto do estudante:
${goalsSummary}

Com base nestes objetivos em aberto e princípios de neurociência da aprendizagem (repetição espaçada, técnica Pomodoro, intercalação e recuperação ativa), forneça:
1. Uma dica acolhedora, prática e direta para a sessão de hoje (máximo 2 a 3 frases).
2. O objetivo prioritário que ele deve focar primeiro hoje e o porquê.
3. A melhor técnica de estudo recomendada para a tarefa (ex: Pomodoro 25m, Feynman, Resolução Ativa, Intercalação).
4. Uma frase inspiradora curta para o dia.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tip: {
              type: Type.STRING,
              description: 'Dica acolhedora e prática de estudo para hoje',
            },
            priorityGoalTitle: {
              type: Type.STRING,
              description: 'Qual objetivo focar primeiro hoje',
            },
            priorityReason: {
              type: Type.STRING,
              description: 'Razão pedagógica para focar nesse objetivo',
            },
            recommendedTechnique: {
              type: Type.STRING,
              description: 'Técnica de estudo recomendada',
            },
            inspirationalQuote: {
              type: Type.STRING,
              description: 'Frase inspiradora curta',
            },
          },
          required: ['tip', 'recommendedTechnique', 'inspirationalQuote'],
        },
      },
    });

    const tipData = JSON.parse(response.text || '{}');
    return res.json({ success: true, ...tipData });

  } catch (error) {
    console.error('Erro ao gerar dica com Gemini:', error);
    const { goals = [] } = req.body;
    const openGoals = goals.filter((g: any) => g.status !== 'completed');
    const firstGoal = openGoals[0];

    return res.json({
      success: true,
      tip: firstGoal 
        ? `Comece pelo objetivo "${firstGoal.title}". Realizar um único bloco de 25 minutos logo no início reduz a resistência mental e ativa o ritmo de foco para o resto do dia.`
        : 'Organize suas prioridades diárias em blocos curtos de 25 minutos. A constância vale muito mais do que longas maratonas desgastantes.',
      priorityGoalTitle: firstGoal ? firstGoal.title : 'Cadastre sua primeira meta',
      priorityReason: firstGoal ? 'Priorizar tarefas em andamento evita a sobrecarga cognitiva.' : 'Criar um objetivo dá direção clara ao cérebro.',
      recommendedTechnique: 'Pomodoro 25/5 com Recuperação Ativa',
      inspirationalQuote: 'Pequenos passos diários constroem grandes aprovações.',
      isFallback: true,
    });
  }
});

// 2. ENDPOINT: Chatbot Context-Aware com Gemini 3.8 Flash e Suporte a Google Search Grounding
app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], useSearch = false, studentGoals = [] } = req.body;
    
    // Mapear histórico de mensagens para a API Gemini
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    const goalsSummary = studentGoals.length > 0
      ? `Objetivos do estudante cadastrados no applet:\n` + 
        studentGoals.map((g: any) => `- [${g.category}] ${g.title} (Status: ${g.status === 'completed' ? 'Concluído' : g.status === 'in_progress' ? 'Em Progresso' : 'A Fazer'}, Prioridade: ${g.priority})`).join('\n')
      : 'O estudante ainda não cadastrou metas hoje.';

    const systemInstruction = `Você é o "Mentor StudyRound", um professor e tutor particular acolhedor, inteligente e motivador.
Sua missão é auxiliar estudantes em:
- Explicar matérias com clareza cristalina (Matemática, Física, Biologia, Redação, História, etc.).
- Auxiliar no planejamento e fatiamento dos objetivos de estudo em blocos Pomodoro.
- Sugerir cronogramas de estudo e técnicas cognitivas comprovadas (Método Feynman, repetição espaçada, mapas mentais).
- Se a pesquisa no Google estiver ativada, use os dados em tempo real para trazer informações recentes sobre datas de vestibulares, editais de concursos e atualidades.
- Mantenha sempre um tom paciente, acolhedor e encorajador em português do Brasil. Use markdown para listas e fórmulas quando apropriado.

${goalsSummary}`;

    const config: any = {
      systemInstruction,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config,
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    return res.json({
      success: true,
      text,
      groundingChunks,
      webSearchQueries,
    });
  } catch (err: any) {
    console.error('Erro no Chatbot Gemini:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao processar mensagem no chat.',
    });
  }
});

// 3. ENDPOINT: Pesquisa Acadêmica com Google Search Grounding (gemini-3.8-flash)
app.post('/api/search-grounding', async (req, res) => {
  try {
    const { query, topic = '' } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Consulta não fornecida' });
    }

    const prompt = topic 
      ? `Tópico de estudo: "${topic}"\nPergunta de pesquisa com busca atualizada: ${query}`
      : `Pesquisa de estudo com dados em tempo real: ${query}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Você é um pesquisador acadêmico do StudyRound. Forneça respostas atualizadas, precisas e objetivas em português do Brasil utilizando o Google Search. Liste os pontos mais recentes e confiáveis.',
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    return res.json({
      success: true,
      text,
      groundingChunks,
      webSearchQueries,
    });
  } catch (err: any) {
    console.error('Erro na pesquisa com Google Search:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao buscar informações atualizadas no Google.',
    });
  }
});

// 4. ENDPOINT: Transcrição de Áudio de Voz / Aulas via Gemini 3.5 Transcribe
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      return res.status(400).json({ success: false, error: 'Nenhum áudio fornecido para transcrição.' });
    }

    const cleanBase64 = audioData.includes('base64,') 
      ? audioData.split('base64,')[1] 
      : audioData;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType.split(';')[0] || 'audio/webm',
              data: cleanBase64,
            },
          },
          {
            text: 'Transcreva com precisão o que foi dito neste áudio em português do Brasil, utilizando pontuação e parágrafos adequados.',
          },
        ],
      },
    });

    const transcription = response.text || '';
    return res.json({ success: true, transcription });
  } catch (err: any) {
    console.error('Erro ao transcrever áudio com Gemini 3.5 Transcribe:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro ao processar áudio.',
    });
  }
});

// Criação do HTTP Server para suportar WebSocket junto ao Express
const server = http.createServer(app);

// 5. WEBSOCKET: Conversas de Voz em Tempo Real via Gemini Live API (gemini-3.8-live)
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Cliente conectado ao WebSocket do Gemini Live');

  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
        systemInstruction: `Você é o Tutor de Voz do StudyRound, conversando em tempo real com um estudante brasileiro.
Seu estilo é caloroso, motivador, conciso e acolhedor.
Ajude o estudante a revisar tópicos, formule perguntas rápidas de fixação, explique dúvidas de matérias de forma simples e direta, e encoraje-o a manter o foco em seus blocos Pomodoro.
Fale em português do Brasil natural e fluido. Evite monólogos longos para manter uma conversa dinâmica e interativa.`,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          // Extrair áudio da resposta do modelo
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === clientWs.OPEN) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === clientWs.OPEN) {
            clientWs.close();
          }
        },
      },
    });

    clientWs.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && session) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (err) {
        console.warn('Erro ao processar mensagem do cliente para Gemini Live:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('Cliente desconectado do Gemini Live');
      try {
        if (session) session.close();
      } catch (e) {
        // ignore
      }
    });

    clientWs.on('error', (err: any) => {
      console.error('Erro no WebSocket do cliente:', err);
      try {
        if (session) session.close();
      } catch (e) {
        // ignore
      }
    });

  } catch (err) {
    console.error('Erro ao iniciar sessão com Gemini Live API:', err);
    clientWs.send(JSON.stringify({ error: 'Não foi possível conectar ao Gemini Live.' }));
    clientWs.close();
  }
});

// Setup do Vite dev server ou arquivos estáticos
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyRound server + WebSocket rodando na porta ${PORT}`);
  });
}

startServer();
