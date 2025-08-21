

* It should be possible to change gemini key later as well

* Ensure that prompt is also saved in browser storage

* there should be a changelog and prompt history and readme maintained. These should be ensured to be updated as code changes are made.

* there should be a changelog and readme maintained. Keep them updated as you modify the code

* Gemini key input box shouldn't be shown in the beginning. If their is no key saved, it should be shown above "Source" (pdf upload button)

* There should be an advanced option to modify the model, by default it should be gemini 2.5 pro. Also an advanced option to change temp.

* Each response from the model should be shown separately in the right section. PDF should be uploaded using the process described here https://ai.google.dev/gemini-api/docs/document-processing

* why don't you use @google/genai sdk instead of directly using fetch calls. Check the documentation it is possible to use sdk

* When using gemini there can be frequent errors, quota exceeded (429 status code), server error(500 status code), emptry response, thought process leaking (indicated by presence of "<ctrl94>" in response content). In all of these cases, the request should be retried, with 60s wait time and after 4-5 retries the process should be paused, so user can resume if they want to . What is happening should be clearly shown to the user in the UI with proper communication. When waiting is happening it should be indicated, show spinner when request is happening or things

* Can you use some icons library. And also use packages file, so i can build the project outside of this environment

* Can you add commands in package.json so that app can be compiled and run and a dev running command. Is vite needed here?

* Show metadata information like prompt consumed, cache tokens, error code, error message etc (all this metadata returnied in gemini response) in trace








