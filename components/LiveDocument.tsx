
import React, { useEffect, useRef } from 'react';
import { Status } from '../types';
import ReactMarkdown from 'react-markdown';

interface LiveDocumentProps {
  responses: string[];
  status: Status;
  error: string | null;
}

export const LiveDocument: React.FC<LiveDocumentProps> = ({ responses, status, error }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [responses, status]);

  const renderContent = () => {
    if (status === Status.Error) {
      return (
        <div className="text-center text-red-400">
          <h3 className="text-xl font-bold mb-2">An Error Occurred</h3>
          <p className="text-sm bg-red-900/50 p-3 rounded-md">{error}</p>
        </div>
      );
    }
    
    if (!responses || responses.length === 0) {
        if (status === Status.Idle) {
            return <p className="text-gray-400 text-center">Upload a book and press Start to begin distillation.</p>;
        }
        if (status === Status.Uploading) {
            return <p className="text-gray-400 text-center animate-pulse">Uploading file...</p>;
        }
        if (status === Status.ProcessingFile) {
            return <p className="text-gray-400 text-center animate-pulse">Processing file... this may take a moment for large books.</p>;
        }
    }

    return (
      <div className="space-y-4">
        {responses.map((response, index) => (
          <div key={index} className="prose prose-invert prose-sm max-w-none bg-gray-900/50 p-4 rounded-md border border-gray-700">
            <ReactMarkdown>{response}</ReactMarkdown>
            {(status === Status.Running && index === responses.length - 1) && <div className="w-2 h-4 bg-white animate-pulse inline-block ml-1"></div>}
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