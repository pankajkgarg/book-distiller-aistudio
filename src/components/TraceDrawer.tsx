import React from 'react';
import { TraceLog } from '../types';
import { CloseIcon } from './icons';

interface TraceDrawerProps {
  logs: TraceLog[];
  isVisible: boolean;
  onClose: () => void;
}

const getRoleStyles = (role: TraceLog['role']) => {
  switch (role) {
    case 'user':
      return { bg: 'bg-blue-50 dark:bg-blue-900/50', border: 'border-blue-500', label: 'USER', text: 'text-gray-900 dark:text-white' };
    case 'assistant':
      return { bg: 'bg-green-50 dark:bg-green-900/50', border: 'border-green-500', label: 'ASSISTANT', text: 'text-gray-900 dark:text-white' };
    case 'system':
      return { bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-500', label: 'SYSTEM', text: 'text-gray-900 dark:text-white' };
  }
};

export const TraceDrawer: React.FC<TraceDrawerProps> = ({ logs, isVisible, onClose }) => {
  return (
    <div
      className={`absolute top-0 right-0 h-full w-2/5 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      } border-l-2 border-gray-200 dark:border-gray-700 flex flex-col`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trace Log</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
          <CloseIcon />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 pt-10">No logs yet. Start a distillation to see the trace.</div>
        )}
        {logs.map((log, index) => {
          const { bg, border, label, text } = getRoleStyles(log.role);
          return (
            <div key={index} className={`p-3 rounded-lg border-l-4 ${bg} ${border}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`font-bold text-xs ${text}`}>{label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{log.timestamp}</span>
              </div>
              <pre className={`whitespace-pre-wrap text-sm font-sans ${text}`}>{log.content}</pre>
            </div>
          );
        })}
      </div>
    </div>
  );
};