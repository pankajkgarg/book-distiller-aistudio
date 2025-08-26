import { useState, useEffect, useRef, useCallback } from 'react';
import { Status, TraceLog } from '../types';
import { DEFAULT_PROMPT, END_OF_BOOK_MARKER, NEXT_PROMPT } from '../constants';
import { GeminiService } from '../services/geminiService';

const PROMPT_HISTORY_LIMIT = 20;

export const useBookDistiller = () => {
  const [status, setStatus] = useState<Status>(Status.Idle);
  const [apiKey, setApiKeyState] = useState<string | null>(
    () => localStorage.getItem('gemini_api_key')
  );
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
  const [retryInfo, setRetryInfo] = useState<{ attempt: number; maxRetries: number; countdown: number; error: string } | null>(null);


  const geminiServiceRef = useRef<GeminiService | null>(null);
  const statusRef = useRef<Status>(status);
  statusRef.current = status;
  const currentPromptRef = useRef<string>(distillationPrompt);
  currentPromptRef.current = distillationPrompt;
  const countdownIntervalRef = useRef<number | null>(null);

  const setAndStoreApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKeyState(key);
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

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setDistillationLog([]);
    setTraceLogs([]);
    setError(null);
    geminiServiceRef.current = null;
    clearCountdown();
    setRetryInfo(null);
  }, [clearCountdown]);
  
  const handleRetry = useCallback(({ attempt, maxRetries, error }: { attempt: number; maxRetries: number; error: Error }) => {
    setStatus(Status.WaitingToRetry);
    const errorMessage = `Attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in 60s.`;
    addTraceLog('system', errorMessage);
    
    setDistillationLog(prev => prev.slice(0, -1));

    setRetryInfo({ attempt, maxRetries, countdown: 60, error: error.message });
    
    clearCountdown();
    countdownIntervalRef.current = window.setInterval(() => {
        setRetryInfo(prev => {
            if (!prev) return null;
            if (prev.countdown <= 1) {
                clearCountdown();
                return null;
            }
            return { ...prev, countdown: prev.countdown - 1 };
        });
    }, 1000);
  }, [addTraceLog, clearCountdown]);


  const startDistillation = async () => {
    if (!apiKey) {
      setError("A Gemini API key is required to start.");
      setStatus(Status.Error);
      return;
    }
    if (!uploadedFile) {
      setError("A file is required to start.");
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
        geminiServiceRef.current = new GeminiService(apiKey);
        const service = geminiServiceRef.current;

        addTraceLog('system', `Uploading ${uploadedFile.name}...`);

        const processedFile = await service.uploadAndProcessFile(
            uploadedFile,
            (state) => {
                if (state === 'UPLOADING') setStatus(Status.Uploading);
                if (state === 'PROCESSING') {
                    setStatus(Status.ProcessingFile);
                    addTraceLog('system', `File uploaded. Waiting for processing to complete.`);
                }
                if (state === 'ACTIVE') {
                    addTraceLog('system', `File ready.`);
                }
            }
        );
        
        setStatus(Status.Running);
        addTraceLog('user', `[DISTILLATION PROMPT]\n${distillationPrompt}`);
        
        setDistillationLog(['']);
        const stream = service.generateResponseStream(distillationPrompt, model, temperature, {
            file: processedFile,
            onRetry: handleRetry,
        });
        
        let currentResponse = '';
        for await (const result of stream) {
            if (result.type === 'chunk') {
                if (statusRef.current === Status.WaitingToRetry) {
                    setStatus(Status.Running);
                    setRetryInfo(null);
                    clearCountdown();
                    currentResponse = ''; 
                    setDistillationLog(prev => [...prev, '']);
                }
                if (statusRef.current !== Status.Running) break; 
                currentResponse += result.data;
                setDistillationLog(prev => {
                    const newLog = [...prev];
                    newLog[newLog.length - 1] = currentResponse;
                    return newLog;
                });
            } else if (result.type === 'metadata') {
                const { candidates, ...metadata } = result.data as any;
                const cleanedMetadata = {
                    ...metadata,
                    candidates: candidates?.map((c: any) => {
                        const { content, ...rest } = c;
                        return rest;
                    })
                };
                const metadataString = JSON.stringify(cleanedMetadata, null, 2);
                addTraceLog('system', `[METADATA]\n${metadataString}`);
            }
        }
        
        if (statusRef.current === Status.Running) {
          addTraceLog('assistant', currentResponse);
          if (!currentResponse.includes(END_OF_BOOK_MARKER)) {
              await continueDistillation(service);
          } else {
             handleEndOfBook(currentResponse);
          }
        }

    } catch (e: any) {
        const errorMessage = `Distillation failed: ${e.message}`;
        setError(errorMessage);
        setStatus(Status.Paused);
        addTraceLog('system', `${errorMessage}. Process paused.`);
        clearCountdown();
        setRetryInfo(null);
    }
  };

  const continueDistillation = async (service: GeminiService) => {
    while (true) {
        if (![Status.Running, Status.WaitingToRetry].includes(statusRef.current)) {
            break;
        }
        try {
            addTraceLog('user', NEXT_PROMPT);
            setDistillationLog(prev => [...prev, '']);

            const stream = service.generateResponseStream(NEXT_PROMPT, model, temperature, {
                onRetry: handleRetry
            });
            
            let currentResponse = '';

            for await (const result of stream) {
                if (result.type === 'chunk') {
                    if (statusRef.current === Status.WaitingToRetry) {
                        setStatus(Status.Running);
                        setRetryInfo(null);
                        clearCountdown();
                        currentResponse = '';
                        setDistillationLog(prev => [...prev, '']);
                    }
                    if (statusRef.current !== Status.Running) break;
                    currentResponse += result.data;
                    setDistillationLog(prev => {
                        const newLog = [...prev];
                        newLog[newLog.length - 1] = currentResponse;
                        return newLog;
                    });
                } else if (result.type === 'metadata') {
                    const { candidates, ...metadata } = result.data as any;
                    const cleanedMetadata = {
                        ...metadata,
                        candidates: candidates?.map((c: any) => {
                            const { content, ...rest } = c;
                            return rest;
                        })
                    };
                    const metadataString = JSON.stringify(cleanedMetadata, null, 2);
                    addTraceLog('system', `[METADATA]\n${metadataString}`);
                }
            }
            
            if (statusRef.current !== Status.Running) break;
            addTraceLog('assistant', currentResponse);

            if (currentResponse.includes(END_OF_BOOK_MARKER)) {
                handleEndOfBook(currentResponse);
                break;
            }

        } catch (e: any) {
            const errorMessage = `Distillation failed during conversation turn: ${e.message}`;
            setError(errorMessage);
            setStatus(Status.Paused);
            addTraceLog('system', `${errorMessage}. Process paused.`);
            clearCountdown();
            setRetryInfo(null);
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
    apiKey,
    setAndStoreApiKey,
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
    model,
    setAndStoreModel,
    temperature,
    setAndStoreTemperature,
    error,
    retryInfo,
  };
};