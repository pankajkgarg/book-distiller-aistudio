

import { GoogleGenAI, Chat, File as GeminiFile, Part, GenerateContentResponse } from "@google/genai";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 60000;

export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  public async uploadAndProcessFile(
    file: globalThis.File, 
    onStateChange: (state: 'UPLOADING' | 'PROCESSING' | 'ACTIVE' | 'FAILED') => void
  ): Promise<GeminiFile> {
    onStateChange('UPLOADING');
    const uploadedFile = await this.ai.files.upload({
      file: file,
      config: {
        displayName: file.name,
      },
    });
    
    onStateChange('PROCESSING');
    let getFile = await this.ai.files.get({ name: uploadedFile.name });
    while (getFile.state === 'PROCESSING') {
      await new Promise(resolve => setTimeout(resolve, 3000));
      getFile = await this.ai.files.get({ name: uploadedFile.name });
    }

    if (getFile.state === 'FAILED') {
      onStateChange('FAILED');
      throw new Error('File processing failed.');
    }
    
    onStateChange('ACTIVE');
    return getFile;
  }

  public async *generateResponseStream(
    prompt: string,
    model: string,
    temperature: number,
    options: {
        file?: GeminiFile;
        onRetry: (details: { attempt: number; maxRetries: number; error: Error }) => void;
    }
  ): AsyncGenerator<{type: 'chunk', data: string} | {type: 'metadata', data: GenerateContentResponse}> {
    const { file, onRetry } = options;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const stream = this.sendMessageAndCheckResponse(prompt, model, temperature, file);
            for await (const result of stream) {
                yield result;
            }
            return; 
        } catch (error: any) {
            if (attempt < MAX_RETRIES) {
                onRetry({ attempt, maxRetries: MAX_RETRIES, error });
                // With the new SDK, chat history is private. We will retry on the same chat
                // object, assuming a failed call doesn't corrupt its internal state.
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                continue;
            } else {
                const finalError = new Error(`Failed after ${attempt > 1 ? `${attempt} attempts` : 'the first attempt'}. Last error: ${error.message}`);
                throw finalError;
            }
        }
    }
  }

  private async *sendMessageAndCheckResponse(
    prompt: string,
    model: string,
    temperature: number,
    file?: GeminiFile
  ): AsyncGenerator<{type: 'chunk', data: string} | {type: 'metadata', data: GenerateContentResponse}> {
    if (!this.chat) {
      this.chat = this.ai.chats.create({
        model: model,
        config: { temperature: temperature }
      });
    }

    const parts: Part[] = [{ text: prompt }];
    if (file && file.uri && file.mimeType) {
      parts.push({
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        }
      });
    }
    
    const stream = await this.chat.sendMessageStream({ message: parts });
    
    let fullResponseText = "";
    let hasYielded = false;
    let lastChunk: GenerateContentResponse | null = null;

    for await (const chunk of stream) {
        lastChunk = chunk;
        const text = chunk.text;
        if (text) {
          yield { type: 'chunk', data: text };
          fullResponseText += text;
          hasYielded = true;
        }
    }

    if (!hasYielded || fullResponseText.trim() === "") {
        throw new Error("Invalid response: Response was empty.");
    }
    if (fullResponseText.includes("<ctrl94>")) {
        throw new Error("Invalid response: Detected thought process leakage.");
    }
    
    if (lastChunk) {
        yield { type: 'metadata', data: lastChunk };
    }
  }
}