
import React, { useState } from 'react';
import { KeyIcon, CloseIcon } from './icons';

interface ApiKeyModalProps {
  onApiKeySubmit: (key: string) => void;
  onClose?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onApiKeySubmit, onClose }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onApiKeySubmit(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full border border-gray-700 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
            <button onClick={onClose} className="absolute top-3 right-3 p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors" aria-label="Close">
                <CloseIcon />
            </button>
        )}
        <div className="text-center">
          <KeyIcon className="mx-auto h-12 w-12 text-indigo-400" />
          <h2 className="mt-4 text-2xl font-bold text-white">Enter Gemini API Key</h2>
          <p className="mt-2 text-sm text-gray-400">
            Your API key is stored locally in your browser and is never sent to our servers.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="relative">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Your Gemini API Key"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!key.trim()}
            className="w-full mt-4 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Save and Continue
          </button>
        </form>
         <div className="text-center mt-4">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-indigo-400 underline">
                Get your API key from Google AI Studio
            </a>
        </div>
      </div>
    </div>
  );
};
