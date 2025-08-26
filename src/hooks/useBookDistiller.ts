import { useState, useRef, useCallback } from 'react';
import { Status, TraceLog } from '../types';
import { DEFAULT_PROMPT, END_OF_BOOK_MARKER, NEXT_PROMPT } from '../constants';
import { GeminiService } from '../services/geminiService';
import { GenerateContentResponse, File as GeminiFile } from '@google/genai';

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
  const [processedFile, setProcessedFile] = useState<GeminiFile | null>(null);
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
  
  const addMetadataToTrace = useCallback((metadata: GenerateContentResponse) => {
    const { candidates, ...meta } = metadata as any;
    const cleanedMetadata = {
        ...meta,
        candidates: candidates?.map((c: any) => {
            const { content, ...rest } = c;
            return rest;
        })
    };
    const metadataString = JSON.stringify(cleanedMetadata, null, 2);
    addTraceLog('system', `[METADATA]\n${metadataString}`);
  }, [addTraceLog]);

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
    setProcessedFile(null);
    clearCountdown();
    setRetryInfo(null);
  }, [clearCountdown]);
  
  const handleRetry = useCallback(({ attempt, maxRetries, error, delay }: { attempt: number; maxRetries: number; error: Error; delay: number }) => {
    setStatus(Status.WaitingToRetry);
    const delayInSeconds = Math.ceil(delay / 1000);
    const errorMessage = `Attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${delayInSeconds}s.`;
    addTraceLog('system', errorMessage);
    
    setRetryInfo({ attempt, maxRetries, countdown: delayInSeconds, error: error.message });
    
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

        const file = await service.uploadAndProcessFile(
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
        setProcessedFile(file);
        
        setStatus(Status.Running);
        addTraceLog('user', `[DISTILLATION PROMPT]\n${distillationPrompt}`);
        
        setDistillationLog(['']);
        
        const { text, metadata } = await service.generateResponse(distillationPrompt, model, temperature, {
            file: file,
            onRetry: handleRetry,
        });
        
        if (statusRef.current === Status.WaitingToRetry) {
            setStatus(Status.Running);
            setRetryInfo(null);
            clearCountdown();
        }
        if (statusRef.current !== Status.Running) return; 

        setDistillationLog(prev => {
            const newLog = [...prev];
            newLog[newLog.length - 1] = text;
            return newLog;
        });
        addMetadataToTrace(metadata);
        
        if (statusRef.current === Status.Running) {
          addTraceLog('assistant', text);
          if (!text.includes(END_OF_BOOK_MARKER)) {
              await continueDistillation(service);
          } else {
             handleEndOfBook(text);
          }
        }

    } catch (e: any) {
        const errorMessage = `Distillation failed: ${e.message}`;
        setError(errorMessage);
        setStatus(Status.Error);
        addTraceLog('system', `${errorMessage}. Process stopped. Manual retry is available.`);
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

            const { text, metadata } = await service.generateResponse(NEXT_PROMPT, model, temperature, {
                onRetry: handleRetry
            });
            
            if (statusRef.current === Status.WaitingToRetry) {
                setStatus(Status.Running);
                setRetryInfo(null);
                clearCountdown();
            }
            if (statusRef.current !== Status.Running) break;

            setDistillationLog(prev => {
                const newLog = [...prev];
                newLog[newLog.length - 1] = text;
                return newLog;
            });
            addMetadataToTrace(metadata);
            
            addTraceLog('assistant', text);

            if (text.includes(END_OF_BOOK_MARKER)) {
                handleEndOfBook(text);
                break;
            }

        } catch (e: any) {
            const errorMessage = `Distillation failed during conversation turn: ${e.message}`;
            setError(errorMessage);
            setStatus(Status.Error);
            addTraceLog('system', `${errorMessage}. Process stopped. Manual retry is available.`);
            clearCountdown();
            setRetryInfo(null);
            break;
        }
    }
  };

  const manualRetry = async () => {
    if (!geminiServiceRef.current) {
      console.error("Cannot retry: Gemini service not initialized.");
      // Attempt a full restart if service is missing
      await startDistillation();
      return;
    }
    const service = geminiServiceRef.current;
    
    setError(null);
    setStatus(Status.Running);
    addTraceLog('system', "Manual retry initiated...");

    const isInitialCall = distillationLog.length === 1;

    try {
        if (isInitialCall) {
            if (!processedFile) {
                throw new Error("Processed file is missing for retry.");
            }
            addTraceLog('user', `[MANUAL RETRY - DISTILLATION PROMPT]\n${distillationPrompt}`);
            
            const { text, metadata } = await service.generateResponse(distillationPrompt, model, temperature, {
                file: processedFile,
                onRetry: handleRetry,
            });

            if (statusRef.current !== Status.Running) return;

            setDistillationLog([text]);
            addMetadataToTrace(metadata);
            addTraceLog('assistant', text);

            if (!text.includes(END_OF_BOOK_MARKER)) {
                await continueDistillation(service);
            } else {
                handleEndOfBook(text);
            }
        } else {
            // A subsequent call failed, so we can just continue the loop
            await continueDistillation(service);
        }
    } catch (e: any) {
        const errorMessage = `Manual retry failed: ${e.message}`;
        setError(errorMessage);
        setStatus(Status.Error);
        addTraceLog('system', `${errorMessage}. Process stopped. Manual retry is available.`);
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
    manualRetry,
  };
};