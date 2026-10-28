import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Globe, 
  Bot, 
  User, 
  RotateCcw, 
  ExternalLink,
  BookOpen,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { StudyGoal } from '../types/study';
import { audioService } from '../services/audioService';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
  webSearchQueries?: string[];
}

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: StudyGoal[];
  studentName: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome',
    role: 'model',
    text: 'Olá! Sou o Mentor StudyRound ☕. Estou aqui para tirar dúvidas das suas matérias, ajudar a organizar seu cronograma ou explicar conceitos difíceis passo a passo. Você também pode ativar a pesquisa no Google para buscar datas de editais, vestibulares ou notícias recentes!',
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  },
];

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  goals,
  studentName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    audioService.playClick();

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      // Enviar histórico completo para o backend Express
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, text: m.text })),
          useSearch,
          studentGoals: goals.map(g => ({
            id: g.id,
            title: g.title,
            category: g.category,
            status: g.status,
            priority: g.priority,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao comunicar com o mentor');
      }

      const botMessage: ChatMessage = {
        id: 'bot_' + Date.now(),
        role: 'model',
        text: data.text || 'Desculpe, não consegui elaborar a resposta.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        groundingChunks: data.groundingChunks,
        webSearchQueries: data.webSearchQueries,
      };

      setMessages(prev => [...prev, botMessage]);
      audioService.playTaskSuccess();

    } catch (err: any) {
      console.error('Erro no chatbot:', err);
      const errorMessage: ChatMessage = {
        id: 'err_' + Date.now(),
        role: 'model',
        text: 'Não consegui me conectar no momento. Verifique sua conexão e tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    audioService.playClick();
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-amber-50/60 dark:bg-stone-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                  Mentor de Estudos Gemini
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Contextualizado com seus {goals.length} objetivos cadastrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
              title="Limpar histórico da conversa"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Ferramentas / Toggle Google Search */}
        <div className="px-5 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioService.playClick();
                setUseSearch(!useSearch);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition ${
                useSearch
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
              }`}
              title="Ativa o Google Search Grounding para consultar informações em tempo real"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Search em Tempo Real: {useSearch ? 'ATIVADO' : 'DESATIVADO'}</span>
            </button>
          </div>

          <span className="text-[11px] text-stone-400 hidden sm:inline">
            {useSearch ? '🔍 Busca ativa para datas e editais' : '⚡ Respostas rápidas e pedagógicas'}
          </span>
        </div>

        {/* Thread rolável de mensagens */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isBot = m.role === 'model';

            return (
              <div 
                key={m.id}
                className={`flex items-start gap-2.5 max-w-[85%] ${
                  isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isBot
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/50'
                    : 'bg-stone-800 text-stone-100 dark:bg-stone-200 dark:text-stone-900'
                }`}>
                  {isBot ? <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isBot
                    ? 'bg-stone-100/90 dark:bg-stone-800/90 text-stone-800 dark:text-stone-100 border border-stone-200/60 dark:border-stone-700/60 shadow-xs'
                    : 'bg-amber-600 text-white shadow-xs'
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Citações do Google Search Grounding se houver */}
                  {isBot && m.groundingChunks && m.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-stone-700 text-[11px]">
                      <span className="font-bold text-stone-500 dark:text-stone-400 flex items-center gap-1 mb-1">
                        <Globe className="w-3 h-3 text-blue-500" /> Fontes verificadas via Google Search:
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {m.groundingChunks.slice(0, 4).map((chunk, idx) => {
                          if (!chunk.web?.uri) return null;
                          return (
                            <a
                              key={idx}
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-blue-600 dark:text-blue-400 hover:underline text-[10px] truncate max-w-[200px]"
                            >
                              <span>{chunk.web.title || chunk.web.uri}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className={`text-[10px] mt-1.5 text-right ${
                    isBot ? 'text-stone-400' : 'text-amber-200'
                  }`}>
                    {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 max-w-[70%] mr-auto">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              </div>
              <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs text-stone-500">
                Mentor pensando e estruturando resposta...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugestões Rápidas de Pergunta */}
        <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleSend('Como organizar meu cronograma com o método Pomodoro?')}
            className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-amber-50 px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 whitespace-nowrap"
          >
            🗓️ Dicas de Cronograma
          </button>
          <button
            onClick={() => {
              setUseSearch(true);
              handleSend('Quais são as principais datas e novidades do ENEM e vestibulares deste ano?');
            }}
            className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-900 whitespace-nowrap"
          >
            🔍 Pesquisar Calendário ENEM/Vestibulares
          </button>
          <button
            onClick={() => handleSend('Me explique o Método Feynman de aprendizagem ativa.')}
            className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-amber-50 px-2.5 py-1 rounded-xl border border-stone-200 dark:border-stone-700 whitespace-nowrap"
          >
            🧠 Método Feynman
          </button>
        </div>

        {/* Input de Envio */}
        <div className="p-3 sm:p-4 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pergunte sobre matérias, técnicas ou peça um resumo..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-3 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white shadow-xs transition active:scale-95 shrink-0"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
