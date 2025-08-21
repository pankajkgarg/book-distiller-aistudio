
const FILE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/files';

export class GeminiFileService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API key is required for GeminiFileService.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Uploads a file to the Gemini API. This is a two-step process:
   * 1. Create a file resource to get an upload URI.
   * 2. Upload the raw file bytes to the provided URI.
   * @param file The file to upload.
   * @returns The name of the created file resource (e.g., "files/some-id").
   */
  async uploadFile(file: File): Promise<string> {
    // 1. Create file resource to get an upload URI.
    const createResponse = await fetch(`${FILE_API_BASE}`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: { display_name: file.name }
      })
    });
    if (!createResponse.ok) {
        throw new Error(`Failed to create file resource: ${await createResponse.text()}`);
    }
    const createResult = await createResponse.json();
    const uploadUri = createResult.file.upload_uri;
    const fileName = createResult.file.name;

    // 2. Upload the raw file bytes to the upload URI.
    const uploadResponse = await fetch(uploadUri, {
        method: 'POST',
        headers: {
            'x-goog-api-key': this.apiKey,
            'Content-Type': file.type,
        },
        body: file
    });

    if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file bytes: ${await uploadResponse.text()}`);
    }

    return fileName;
  }

  /**
   * Polls the state of a file until it is either ACTIVE or FAILED.
   * @param fileName The name of the file resource to poll.
   * @returns A promise that resolves with the file data when it's ACTIVE.
   */
  async pollFileState(fileName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        try {
            const response = await fetch(`${FILE_API_BASE}/${fileName}`, {
                headers: { 'x-goog-api-key': this.apiKey }
            });

            if (!response.ok) {
                // Stop polling on non-transient errors
                clearInterval(intervalId);
                reject(new Error(`Polling failed with status: ${response.status}`));
                return;
            }

            const fileData = await response.json();
            
            if (fileData.state === 'ACTIVE') {
                clearInterval(intervalId);
                resolve(fileData);
            } else if (fileData.state === 'FAILED') {
                clearInterval(intervalId);
                reject(new Error(`File processing failed: ${fileData.error?.message || 'Unknown error'}`));
            }
            // If state is 'PROCESSING', continue polling.
        } catch (error) {
            clearInterval(intervalId);
            reject(error);
        }
      }, 3000); // Poll every 3 seconds
    });
  }
}