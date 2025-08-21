import React from 'react';
import { useState } from 'react';

import { Header } from './components/Header';
import { SourcePanel } from './components/SourcePanel';
import { LiveDocument } from './components/LiveDocument';
import { TraceDrawer } from './components/TraceDrawer';
import { useBookDistiller } from './hooks/useBookDistiller';
import { Status } from './types';

export default function App(): React.ReactNode {
  const [isTraceVisible, setIsTraceVisible] = useState(false);
  const {
    status,
    setStatus,
    distillationPrompt,
    setDistillationPrompt,
    promptHistory,
    distillationLog,
    traceLogs,
    uploadedFile,
    setUploadedFile,
    startDistillation,
    pauseDistillation,
    stopDistillation,
    model,
    setAndStoreModel,
    temperature,
    setAndStoreTemperature,
    error,
    retryInfo,
  } = useBookDistiller();

  const fullDocumentContent = distillationLog.join('\n\n');

  const handleExport = (format: 'md' | 'txt') => {
    const blob = new Blob([fullDocumentContent], { type: 'text/plain;charset=utf-t' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = uploadedFile?.name.replace(/\.[^/.]+$/, "") || 'distillation';
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullDocumentContent);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <Header
        status={status}
        onStart={startDistillation}
        onPause={pauseDistillation}
        onStop={stopDistillation}
        onExport={handleExport}
        onCopy={handleCopy}
        onToggleTrace={() => setIsTraceVisible(!isTraceVisible)}
        isTraceVisible={isTraceVisible}
        isActionable={uploadedFile !== null}
        retryInfo={retryInfo}
      />
      <main className="flex flex-1 overflow-hidden">
        <div className="w-1/3 border-r border-gray-700 flex flex-col p-4 overflow-y-auto">
            <SourcePanel
              prompt={distillationPrompt}
              onPromptChange={setDistillationPrompt}
              promptHistory={promptHistory}
              onFileChange={(file) => {
                stopDistillation();
                setUploadedFile(file);
              }}
              file={uploadedFile}
              status={status}
              model={model}
              onModelChange={setAndStoreModel}
              temperature={temperature}
              onTemperatureChange={setAndStoreTemperature}
            />
        </div>
        <div className="w-2/3 flex-1 flex relative">
          <LiveDocument responses={distillationLog} status={status} error={error} retryInfo={retryInfo} />
          <TraceDrawer logs={traceLogs} isVisible={isTraceVisible} onClose={() => setIsTraceVisible(false)} />
        </div>
      </main>
    </div>
  );
}
