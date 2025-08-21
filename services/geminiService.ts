
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface ContentPart {
  text?: string;
  file_data?: {
    mime_type: string;
    file_uri: string;
  };
}

interface Content {
  role: 'user' | 'model';
  parts: ContentPart[];
}

export class GeminiService {
  private apiKey: string;
  private history: Content[] = [];

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required for GeminiService.");
    }
    this.apiKey = apiKey;
  }

  public async *generateResponseStream(
    prompt: string,
    model: string,
    temperature: number,
    fileUri?: string
  ): AsyncGenerator<string> {
    const userParts: ContentPart[] = [{ text: prompt }];
    if (fileUri) {
      // fileUri is only for the first message of a conversation
      this.history = []; 
      userParts.unshift({
        file_data: {
          mime_type: 'application/pdf',
          file_uri: fileUri,
        },
      });
    }

    this.history.push({ role: 'user', parts: userParts });

    const url = `${API_BASE}/${model}:streamGenerateContent?alt=sse`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        contents: this.history,
        generationConfig: {
          temperature: temperature,
        },
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    if (!response.body) {
        throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedResponse = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonString = line.substring(6);
                try {
                    const parsed = JSON.parse(jsonString);
                    const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        accumulatedResponse += text;
                        yield text;
                    }
                } catch (e) {
                    console.error("Error parsing SSE data chunk:", e, "Data:", jsonString);
                }
            }
        }
    }
    
    // Add the full model response to history for the next turn
    this.history.push({ role: 'model', parts: [{ text: accumulatedResponse }]});
  }
}