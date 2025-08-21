
import { useState, useEffect, useRef, useCallback } from 'react';
import { Status, TraceLog } from '../types';
import { DEFAULT_PROMPT, END_OF_BOOK_MARKER, NEXT_PROMPT } from '../constants';
import { GeminiService } from '../services/geminiService';
import { GeminiFileService } from '../services/geminiFileService';

const PROMPT_HISTORY_LIMIT = 20;

export const useBookDistiller = () => {
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini_api_key'));
  const [status, setStatus] = useState<Status>(Status.Idle);
  const [distillationPrompt, setDistillationPromptState] = useState<string>(
    () => localStorage.getItem('distillation_prompt') || DEFAULT_PROMPT
  );
  const [promptHistory, setPromptHistory] = useState<string[]>(
    () => JSON.parse(localStorage.getItem('prompt_history') || '[]')
  );
  const [distillationLog, setDistillationLog] = useState<string[]>([]);
  const [traceLogs, setTraceLogs] = useState<TraceLog[]>([]);
  const [model, setModelState] = useState<string>(
    () => localStorage.getItem('gemini_model') || 'gemini-2.5-flash'
  );
  const [temperature, setTemperatureState] = useState<number>(
    () => parseFloat(localStorage.getItem('gemini_temperature') || '0.7')
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const geminiServiceRef = useRef<GeminiService | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const statusRef = useRef<Status>(status);
  statusRef.current = status;
  const currentPromptRef = useRef<string>(distillationPrompt);
  currentPromptRef.current = distillationPrompt;

  const setAndStoreApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key);
  };

  const setAndStoreDistillationPrompt = (prompt: string) => {
    localStorage.setItem('distillation_prompt', prompt);
    setDistillationPromptState(prompt);
  };

  const setAndStoreModel = (newModel: string) => {
    localStorage.setItem('gemini_model', newModel);
    setModelState(newModel);
  };

  const setAndStoreTemperature = (newTemp: number) => {
    localStorage.setItem('gemini_temperature', newTemp.toString());
    setTemperatureState(newTemp);
  };

  const addTraceLog = useCallback((role: 'user' | 'assistant' | 'system', content: string) => {
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      role,
      content,
    };
    setTraceLogs(prev => [...prev, newLog]);
  }, []);

  const resetState = useCallback(() => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    setDistillationLog([]);
    setTraceLogs([]);
    setError(null);
    geminiServiceRef.current = null;
  }, []);


  const startDistillation = async () => {
    if (!uploadedFile || !apiKey) {
      setError("API Key and a file are required to start.");
      setStatus(Status.Error);
      return;
    }

    const currentPrompt = currentPromptRef.current.trim();
    if (currentPrompt) {
        setPromptHistory(prevHistory => {
            const newHistory = [currentPrompt, ...prevHistory.filter(p => p !== currentPrompt)].slice(0, PROMPT_HISTORY_LIMIT);
            localStorage.setItem('prompt_history', JSON.stringify(newHistory));
            return newHistory;
        });
    }

    resetState();
    
    try {
        setStatus(Status.Uploading);
        addTraceLog('system', `Uploading ${uploadedFile.name}...`);
        const fileService = new GeminiFileService(apiKey);
        const fileName = await fileService.uploadFile(uploadedFile);
        
        setStatus(Status.ProcessingFile);
        addTraceLog('system', `File uploaded. Waiting for processing to complete. File name: ${fileName}`);
        const fileData = await fileService.pollFileState(fileName);
        const fileUri = fileData.uri;
        addTraceLog('system', `File ready. URI: ${fileUri}`);

        geminiServiceRef.current = new GeminiService(apiKey);
        setStatus(Status.Running);

        addTraceLog('user', `[DISTILLATION PROMPT]\n${distillationPrompt}`);
        
        // Initial Turn
        const stream = geminiServiceRef.current.generateResponseStream(distillationPrompt, model, temperature, fileUri);
        
        let currentResponse = '';
        setDistillationLog(['']);
        for await (const chunk of stream) {
            if (statusRef.current !== Status.Running) break; 
            currentResponse += chunk;
            setDistillationLog(prev => {
                const newLog = [...prev];
                newLog[newLog.length - 1] = currentResponse;
                return newLog;
            });
        }
        
        if (statusRef.current === Status.Running) {
          addTraceLog('assistant', currentResponse);
          if (!currentResponse.includes(END_OF_BOOK_MARKER)) {
              await continueDistillation(geminiServiceRef.current);
          } else {
             handleEndOfBook(currentResponse);
          }
        }

    } catch (e: any) {
        const errorMessage = `An error occurred: ${e.message}`;
        setError(errorMessage);
        setStatus(Status.Error);
        addTraceLog('system', errorMessage);
    }
  };

  const continueDistillation = async (service: GeminiService) => {
    while (statusRef.current === Status.Running) {
        try {
            addTraceLog('user', NEXT_PROMPT);
            const stream = service.generateResponseStream(NEXT_PROMPT, model, temperature);
            
            let currentResponse = '';
            setDistillationLog(prev => [...prev, '']);

            for await (const chunk of stream) {
                if (statusRef.current !== Status.Running) break;
                currentResponse += chunk;
                setDistillationLog(prev => {
                    const newLog = [...prev];
                    newLog[newLog.length - 1] = currentResponse;
                    return newLog;
                });
            }
            
            if (statusRef.current !== Status.Running) break;
            addTraceLog('assistant', currentResponse);

            if (currentResponse.includes(END_OF_BOOK_MARKER)) {
                handleEndOfBook(currentResponse);
                break;
            }

        } catch (e: any) {
             const errorMessage = `Error during conversation turn: ${e.message}`;
             setError(errorMessage);
             setStatus(Status.Error);
             addTraceLog('system', errorMessage);
             break;
        }
    }
  };
  
  const handleEndOfBook = (finalResponse: string) => {
    const cleanedResponse = finalResponse.replace(END_OF_BOOK_MARKER, '').trim();
    setDistillationLog(prev => {
        const newLog = [...prev];
        newLog[newLog.length-1] = cleanedResponse;
        return newLog;
    });
    addTraceLog('system', 'End of book marker received. Distillation finished.');
    setStatus(Status.Finished);
  };

  const pauseDistillation = () => {
    if (status === Status.Running) {
      setStatus(Status.Paused);
    } else if (status === Status.Paused) {
      setStatus(Status.Running);
      if(geminiServiceRef.current) {
        continueDistillation(geminiServiceRef.current);
      }
    }
  };

  const stopDistillation = () => {
    setStatus(Status.Stopped);
    resetState();
  };
  
  return {
    status,
    setStatus,
    distillationPrompt,
    setDistillationPrompt: setAndStoreDistillationPrompt,
    promptHistory,
    distillationLog,
    traceLogs,
    uploadedFile,
    setUploadedFile,
    startDistillation,
    pauseDistillation,
    stopDistillation,
    apiKey,
    setAndStoreApiKey,
    model,
    setAndStoreModel,
    temperature,
    setAndStoreTemperature,
    error
  };
};