import React, { useRef, useState } from 'react';
import { Status } from '../types';
import { FileIcon, ReplaceIcon, HistoryIcon, ChevronRightIcon } from './icons';
import { PromptHistoryModal } from './PromptHistoryModal';

interface SourcePanelProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  promptHistory: string[];
  onFileChange: (file: File) => void;
  file: File | null;
  status: Status;
  model: string;
  onModelChange: (model: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
}

export const SourcePanel: React.FC<SourcePanelProps> = ({
  prompt, onPromptChange, promptHistory, onFileChange, file, status,
  model, onModelChange, temperature, onTemperatureChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const isDisabled = status === Status.Running || status === Status.ProcessingFile;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileChange(event.target.files[0]);
    }
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSelectPromptFromHistory = (selectedPrompt: string) => {
    onPromptChange(selectedPrompt);
    setIsHistoryModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {isHistoryModalOpen && (
        <PromptHistoryModal 
          history={promptHistory}
          onSelect={handleSelectPromptFromHistory}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
      <div>
        <h2 className="text-lg font-semibold mb-2 text-white">Source</h2>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf"
          disabled={isDisabled}
        />
        {!file ? (
          <button
            onClick={triggerFileSelect}
            disabled={isDisabled}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md flex items-center justify-center space-x-2 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <FileIcon />
            <span>Upload Book (PDF)</span>
          </button>
        ) : (
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
            <div className="flex items-center space-x-2 overflow-hidden">
              <FileIcon />
              <span className="truncate text-gray-200">{file.name}</span>
            </div>
            <button 
              onClick={triggerFileSelect}
              disabled={isDisabled}
              className="p-2 bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ReplaceIcon />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-white">Distillation Prompt</h2>
            <button
                onClick={() => setIsHistoryModalOpen(true)}
                disabled={promptHistory.length === 0}
                className="px-3 py-1 text-sm bg-gray-700 text-white rounded-md flex items-center space-x-2 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                title="View prompt history"
            >
                <HistoryIcon />
                <span>History</span>
            </button>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={isDisabled}
          className="w-full flex-1 p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          placeholder="Enter your distillation prompt here..."
        />
      </div>

      <div className="border-t border-gray-700 pt-4">
        <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="flex items-center justify-between w-full text-left text-lg font-semibold text-white">
          <span>Advanced Settings</span>
          <ChevronRightIcon className={`w-5 h-5 transition-transform duration-200 ${isAdvancedOpen ? 'rotate-90' : ''}`} />
        </button>
        {isAdvancedOpen && (
          <div className="mt-3 space-y-4 p-4 bg-gray-800/50 rounded-md border border-gray-700">
            <div>
              <label htmlFor="model-input" className="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
              <input
                id="model-input"
                type="text"
                value={model}
                onChange={(e) => onModelChange(e.target.value)}
                disabled={isDisabled}
                className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
               <p className="text-xs text-gray-400 mt-1">Recommended: gemini-2.5-flash</p>
            </div>
            <div>
              <label htmlFor="temperature-slider" className="flex justify-between text-sm font-medium text-gray-300 mb-1"><span>Temperature</span> <span>{temperature.toFixed(1)}</span></label>
              <input
                id="temperature-slider"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                disabled={isDisabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};