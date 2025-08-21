import React, { useEffect, useRef } from 'react';
import { Status } from '../types';
import ReactMarkdown from 'react-markdown';
import { SpinnerIcon } from './icons';

interface LiveDocumentProps {
  responses: string[];
  status: Status;
  error: string | null;
  retryInfo: { countdown: number; attempt: number; maxRetries: number; error: string } | null;
}

export const LiveDocument: React.FC<LiveDocumentProps> = ({ responses, status, error, retryInfo }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [responses, status, retryInfo]);

  const renderContent = () => {
    if (status === Status.Error) {
      return (
        <div className="text-center text-red-400">
          <h3 className="text-xl font-bold mb-2">An Error Occurred</h3>
          <p className="text-sm bg-red-900/50 p-3 rounded-md">{error}</p>
        </div>
      );
    }

    if (status === Status.WaitingToRetry && retryInfo) {
      return (
        <div className="text-center text-orange-400 bg-orange-900/50 p-4 rounded-md border border-orange-700">
          <h3 className="text-xl font-bold mb-2">Temporary Issue Detected</h3>
          <p className="text-sm mb-3">The last request failed: <span className="font-mono bg-gray-700/50 px-1 rounded">{retryInfo.error}</span></p>
          <div className="flex items-center justify-center space-x-2">
            <SpinnerIcon />
            <p>
                Retrying in <span className="font-bold text-lg">{retryInfo.countdown}</span> seconds... 
                (Attempt <span className="font-bold">{retryInfo.attempt + 1}</span> of <span className="font-bold">{retryInfo.maxRetries}</span>)
            </p>
          </div>
        </div>
      );
    }
    
    if (!responses || responses.length === 0) {
        if (status === Status.Idle) {
            return <p className="text-gray-400 text-center">Upload a book and press Start to begin distillation.</p>;
        }
        if (status === Status.Uploading) {
            return (
                <div className="flex items-center justify-center text-gray-400 space-x-2">
                    <SpinnerIcon />
                    <span>Uploading file...</span>
                </div>
            );
        }
        if (status === Status.ProcessingFile) {
            return (
                <div className="flex items-center justify-center text-gray-400 space-x-2">
                    <SpinnerIcon />
                    <span>Processing file... this may take a moment for large books.</span>
                </div>
            );
        }
    }

    return (
      <div className="space-y-4">
        {responses.map((response, index) => (
          <div key={index} className="prose prose-invert prose-sm max-w-none bg-gray-900/50 p-4 rounded-md border border-gray-700">
            <ReactMarkdown>{response}</ReactMarkdown>
            {(status === Status.Running && index === responses.length - 1) && (
              <div className="flex items-center pt-2 mt-2 border-t border-gray-700/50">
                  <SpinnerIcon />
                  <span className="text-sm text-gray-400">Generating...</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div ref={scrollRef} className="w-full h-full p-6 overflow-y-auto bg-gray-800/50">
      <div className="max-w-4xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};
