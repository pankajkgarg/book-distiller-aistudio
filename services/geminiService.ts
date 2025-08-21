
import { GoogleGenAI, Chat, File as GeminiFile, Part, FileDataPart } from "@google/genai";

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
      // Wait for 3 seconds before polling again
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
    file?: GeminiFile
  ): AsyncGenerator<string> {
    
    if (!this.chat) {
      this.chat = this.ai.chats.create({
        model: model,
        config: { temperature: temperature }
      });
    }

    const parts: (Part | FileDataPart)[] = [{ text: prompt }];
    if (file && file.uri && file.mimeType) {
      parts.push({
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        }
      });
    }
    
    const stream = await this.chat.sendMessageStream({ message: parts });

    for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          yield text;
        }
    }
  }
}