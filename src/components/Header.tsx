import React from 'react';
import { Status } from '../types';
import { PlayIcon, PauseIcon, StopIcon, ExportIcon, ClipboardIcon, ChevronRightIcon, SettingsIcon } from './icons';

interface HeaderProps {
  status: Status;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onExport: (format: 'md' | 'txt') => void;
  onCopy: () => void;
  onToggleTrace: () => void;
  isTraceVisible: boolean;
  isActionable: boolean;
  retryInfo: { attempt: number; maxRetries: number } | null;
  onOpenSettings: () => void;
}

const getStatusColor = (status: Status) => {
  switch (status) {
    case Status.Running: return 'text-green-400';
    case Status.Paused: return 'text-yellow-400';
    case Status.Error: return 'text-red-400';
    case Status.Finished: return 'text-blue-400';
    case Status.ProcessingFile: return 'text-purple-400';
    case Status.WaitingToRetry: return 'text-orange-400';
    default: return 'text-gray-400';
  }
};

export const Header: React.FC<HeaderProps> = ({
  status,
  onStart,
  onPause,
  onStop,
  onExport,
  onCopy,
  onToggleTrace,
  isTraceVisible,
  isActionable,
  retryInfo,
  onOpenSettings,
}) => {
  const isRunning = status === Status.Running;
  const isPaused = status === Status.Paused;
  const isStopped = status === Status.Idle || status === Status.Stopped || status === Status.Finished || status === Status.Error;

  const renderStatus = () => {
    if (status === Status.WaitingToRetry && retryInfo) {
      return `Waiting to Retry (${retryInfo.attempt}/${retryInfo.maxRetries})`;
    }
    return status;
  };

  return (
    <header className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800 shadow-md">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-white mr-6">DistillBoard — Autopilot</h1>
        <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
            <span className={`font-mono text-sm ${getStatusColor(status)}`}>{renderStatus()}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onStart}
          disabled={!isActionable || isRunning || isPaused}
          className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center space-x-2 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <PlayIcon />
          <span>Start</span>
        </button>
        <button
          onClick={onPause}
          disabled={!isRunning && !isPaused}
          className="px-3 py-2 bg-yellow-500 text-white rounded-md flex items-center space-x-2 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <PauseIcon />
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>
        <button
          onClick={onStop}
          disabled={isStopped}
          className="px-3 py-2 bg-red-600 text-white rounded-md flex items-center space-x-2 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <StopIcon />
          <span>Stop</span>
        </button>
        <div className="h-6 w-px bg-gray-600 mx-2"></div>
        <button
          onClick={() => onExport('md')}
          disabled={status !== Status.Finished}
          className="px-3 py-2 bg-blue-600 text-white rounded-md flex items-center space-x-2 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <ExportIcon />
          <span>Export</span>
        </button>
         <button
          onClick={onCopy}
          disabled={status !== Status.Finished}
          className="p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <ClipboardIcon />
        </button>
        <div className="h-6 w-px bg-gray-600 mx-2"></div>
        <button
          onClick={onOpenSettings}
          className="p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          title="Settings"
        >
          <SettingsIcon />
        </button>
        <button
          onClick={onToggleTrace}
          className={`px-3 py-2 rounded-md flex items-center space-x-2 transition-colors ${isTraceVisible ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
        >
          <span>Trace</span>
          <div className={`transform transition-transform ${isTraceVisible ? 'rotate-180' : ''}`}>
             <ChevronRightIcon />
          </div>
        </button>
      </div>
    </header>
  );
};