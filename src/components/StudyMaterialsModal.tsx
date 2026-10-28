import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  File, 
  Paperclip, 
  Trash2, 
  Sparkles, 
  Eye, 
  Download,
  CheckCircle,
  FolderOpen
} from 'lucide-react';
import { StudyFile, StudyGoal } from '../types/study';
import { summaryService } from '../services/summaryService';
import { audioService } from '../services/audioService';

interface StudyMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StudyFile[];
  goals: StudyGoal[];
  onUploadFile: (fileData: Omit<StudyFile, 'id' | 'uploadedAt'>) => void;
  onDeleteFile: (id: string) => void;
  onOpenSummaryForFile: (file: StudyFile) => void;
  filterGoalId?: string | null;
}

export const StudyMaterialsModal: React.FC<StudyMaterialsModalProps> = ({
  isOpen,
  onClose,
  files,
  goals,
  onUploadFile,
  onDeleteFile,
  onOpenSummaryForFile,
  filterGoalId,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(filterGoalId || '');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<StudyFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const text = await summaryService.extractTextFromFile(file);

        // Se for imagem ou PDF, tentar criar dataUrl
        let dataUrl: string | undefined;
        if (file.type.startsWith('image/') || file.size < 2 * 1024 * 1024) {
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve((e.target?.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        }

        onUploadFile({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          textContent: text,
          dataUrl,
          goalId: selectedGoalId || undefined,
          notes: notes.trim() || undefined,
        });
      }

      audioService.playTaskSuccess();
      setNotes('');
    } catch (e) {
      console.warn('Erro ao processar arquivos:', e);
    } finally {
      setUploading(false);
    }
  };

  const filteredFiles = filterGoalId 
    ? files.filter(f => f.goalId === filterGoalId)
    : files;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo */}
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-blue-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                Materiais e Arquivos de Estudo
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Anexe PDFs, resumos e anotações para estudar com foco
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
          
          {/* Área de Upload com Drag and Drop */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Vincular a um Objetivo (Opcional):
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">Arquivo Geral da Biblioteca</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.category}: {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Anotação Rápida sobre o Material:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Capítulo 4 ou Lista com gabarito"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 scale-101'
                  : 'border-stone-200 dark:border-stone-700 hover:border-blue-400 bg-stone-50/50 dark:bg-stone-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.json"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
                {uploading ? 'Processando arquivo de estudo...' : 'Clique para enviar ou arraste arquivos aqui'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Suporta PDFs, Textos (.txt, .md) e Imagens para leitura rápida
              </p>
            </div>
          </div>

          {/* Lista de Arquivos Cadastrados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
                Arquivos Salvos ({filteredFiles.length})
              </h3>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-800/20">
                <FileText className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                  Nenhum arquivo anexado ainda
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                  Suba materiais para usar a ferramenta de resumo e fixação automática!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredFiles.map((f) => {
                  const linkedGoal = goals.find(g => g.id === f.goalId);
                  return (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-stone-800/80 hover:shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                              <File className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate" title={f.name}>
                                {f.name}
                              </p>
                              <span className="text-[10px] text-stone-400 dark:text-stone-500">
                                {(f.size / 1024).toFixed(1)} KB • {new Date(f.uploadedAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => { audioService.playClick(); onDeleteFile(f.id); }}
                            className="text-stone-400 hover:text-rose-600 p-1"
                            title="Remover arquivo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {linkedGoal && (
                          <div className="mt-2 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md truncate font-medium">
                            Objetivo: {linkedGoal.title}
                          </div>
                        )}

                        {f.notes && (
                          <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-400 italic">
                            "{f.notes}"
                          </p>
                        )}
                      </div>

                      {/* Botão para gerar resumo automático a partir deste arquivo */}
                      <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-700/50 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            audioService.playClick();
                            onOpenSummaryForFile(f);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gerar Resumo</span>
                        </button>

                        {f.dataUrl && (
                          <a
                            href={f.dataUrl}
                            download={f.name}
                            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                            title="Baixar arquivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
