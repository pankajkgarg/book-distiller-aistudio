import React from 'react';
import { CloseIcon, HistoryIcon } from './icons';

interface PromptHistoryModalProps {
  history: string[];
  onSelect: (prompt: string) => void;
  onClose: () => void;
}

export const PromptHistoryModal: React.FC<PromptHistoryModalProps> = ({ history, onSelect, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full border border-gray-700 relative flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
                <HistoryIcon className="w-6 h-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Prompt History</h2>
            </div>
          <button onClick={onClose} className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {history.length > 0 ? (
            history.map((prompt, index) => (
              <div key={index} className="bg-gray-900/50 p-3 rounded-md border border-gray-700 hover:border-indigo-500 transition-colors">
                <p className="text-sm text-gray-300 line-clamp-3 mb-2">
                  {prompt}
                </p>
                <div className="text-right">
                    <button 
                        onClick={() => onSelect(prompt)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                        Use this prompt
                    </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-8">No prompt history yet. Your previous prompts will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};