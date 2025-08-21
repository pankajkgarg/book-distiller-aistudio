import React, { useState } from 'react';
import { KeyIcon } from './icons';

interface ApiKeyInputProps {
  onApiKeySubmit: (key: string) => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySubmit }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onApiKeySubmit(key.trim());
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="text-center mb-4">
          <KeyIcon className="mx-auto h-8 w-8 text-indigo-400" />
          <h2 className="mt-2 text-xl font-bold text-white">Set Your Gemini API Key</h2>
          <p className="mt-1 text-xs text-gray-400">
            Your key is stored locally and is required to use the app.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter your Gemini API Key"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              aria-label="Gemini API Key"
            />
          </div>
          <button
            type="submit"
            disabled={!key.trim()}
            className="w-full mt-3 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Save Key
          </button>
        </form>
         <div className="text-center mt-3">
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-indigo-400 underline">
                Get your API key from Google AI Studio
            </a>
        </div>
    </div>
  );
};
