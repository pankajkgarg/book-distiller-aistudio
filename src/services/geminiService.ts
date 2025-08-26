import { GoogleGenAI, Chat, File as GeminiFile, Part, GenerateContentResponse } from "@google/genai";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 60000;

export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required for GeminiService.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey });
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

  public async generateResponse(
    prompt: string,
    model: string,
    temperature: number,
    options: {
        file?: GeminiFile;
        onRetry: (details: { attempt: number; maxRetries: number; error: Error }) => void;
    }
  ): Promise<{ text: string; metadata: GenerateContentResponse }> {
    const { file, onRetry } = options;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (!this.chat) {
              this.chat = this.ai.chats.create({
                model: model,
                config: { temperature: temperature }
              });
            }

            const parts: Part[] = [{ text: prompt }];
            // Only send the file on the very first message of the chat
            // FIX: Removed check for `this.chat.history.length` as `history` is a private property.
            // The calling code in `useBookDistiller` ensures the file is only passed on the first call.
            if (file) {
              parts.push({
                fileData: {
                  mimeType: file.mimeType!,
                  fileUri: file.uri!,
                }
              });
            }
            
            const response = await this.chat.sendMessage({ message: parts });
            
            const responseText = response.text;

            if (!responseText || responseText.trim() === "") {
                throw new Error("Invalid response: Response was empty.");
            }
            if (responseText.includes("<ctrl94>")) {
                throw new Error("Invalid response: Detected thought process leakage.");
            }

            return { text: responseText, metadata: response };

        } catch (error: any) {
            if (attempt < MAX_RETRIES) {
                onRetry({ attempt, maxRetries: MAX_RETRIES, error });
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                continue;
            } else {
                const finalError = new Error(`Failed after ${attempt > 1 ? `${attempt} attempts` : 'the first attempt'}. Last error: ${error.message}`);
                throw finalError;
            }
        }
    }
    throw new Error("Distillation failed unexpectedly after all retries.");
  }
}