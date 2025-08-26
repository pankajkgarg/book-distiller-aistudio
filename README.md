# Book Distiller

Book Distiller is an AI-powered web application designed to distill the essence of books. Users can upload a PDF, customize a powerful prompt, and activate an "Autopilot" mode that uses the Gemini API to generate a flowing, in-depth exploration of the book's core themes. The application provides a live-updating document view, a detailed trace log of the AI's operations, and options to export the final text.

## Key Features

-   **Robust PDF Processing**: Utilizes the official Gemini File API. PDFs are uploaded and processed on Google's servers for reliable and accurate content extraction.
-   **Customizable Prompt**: Full control over the master prompt that guides the AI's distillation process.
-   **Prompt History**: Automatically saves your recent prompts, allowing you to easily reuse and iterate on them.
-   **Advanced AI Configuration**: Option to change the underlying Gemini model and adjust the generation temperature for fine-tuned control over the output.
-   **Autopilot Generation**: A multi-turn conversation with the Gemini model automatically generates a continuous, chapter-by-chapter exploration of the book.
-   **Live Response View**: Watch the distillation unfold in real-time, with each response from the AI appearing as a distinct block.
-   **Trace Log**: A transparent, behind-the-scenes look at the prompts sent to and responses received from the AI.
-   **Export & Copy**: Export the final combined document as a Markdown or text file, or copy it directly to your clipboard.
-   **Secure API Key Storage**: Your Gemini API key is stored locally and securely in your browser's storage and is never sent to any server other than Google's.

## Getting Started

1.  **Get a Gemini API Key**: To use the application, you need a free API key from Google AI Studio. You can get one here: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2.  **Install Dependencies**: In a terminal, run `npm install` to download the required packages.
3.  **Run the Development Server**: Run `npm run dev`. This will start a local server, and you can access the app in your browser at the provided URL (usually `http://localhost:5173`).
4.  **Enter Your API Key**: On first launch, you will be prompted to enter your Gemini API key. This is stored securely in your browser's local storage. You can change it later via the settings icon in the header.
5.  **Upload a Book**: Click the "Upload Book (PDF)" button to select your source file.
6.  **Customize Settings (Optional)**: Review and edit the distillation prompt, or expand the "Advanced Settings" to change the model and temperature.
7.  **Start Distillation**: Click the "Start" button to begin the process.

## Development and Building

-   **Run Development Server**: `npm run dev`
-   **Create Production Build**: `npm run build`
-   **Preview Production Build**: `npm run preview`

## Technology Stack

-   **Build Tool**: Vite
-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS
-   **Icons**: React Icons
-   **AI**: Google Gemini SDK (`@google/genai`)
-   **File Processing**: Google Gemini File API