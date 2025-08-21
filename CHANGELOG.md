# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2024-08-01

### Added
-   **Vite Build System**: Integrated Vite for a fast development experience and optimized production builds.
-   Added `dev`, `build`, and `preview` scripts to `package.json` for standardized project management.

### Changed
-   **Project Restructure**: Moved all source files into a `src` directory to follow modern web development conventions.
-   Updated `README.md` with new setup and development instructions.

### Removed
-   Removed obsolete components (`ApiKeyModal`, `ApiKeyInput`) and services (`geminiFileService`) that are no longer in use.

## [2.1.0] - 2024-07-31

### Added
-   `package.json` file to define project dependencies, making the project buildable in standard Node.js environments.

### Changed
-   Replaced all inline SVG icons with a standardized icon library (`react-icons`) for better maintainability and consistency.
-   Removed the `importmap` from `index.html` in favor of standard npm package management.

### Fixed
-   Corrected incomplete text in the prompt history modal.

## [2.0.1] - 2024-07-30

### Changed

-   **Refactor: Adopted @google/genai SDK**: Replaced all manual `fetch` calls to the Gemini REST API with the official `@google/genai` JavaScript SDK. This includes file uploads, polling, and content generation, resulting in a more robust, maintainable, and type-safe codebase.

## [2.0.0] - 2024-07-29

### Changed

-   **MAJOR: Switched to Gemini File API**: PDF processing is no longer done in the browser with `pdf.js`. The application now uses the official Gemini File API to upload and process documents on the server-side, leading to more robust and accurate content extraction.
-   **MAJOR: Redesigned Response Display**: The live document view has been changed. Instead of a single flowing document, each response from the model is now displayed as a separate, styled block, providing a clearer, turn-by-turn view of the distillation process.
-   **Internal: Refactored to use Gemini REST API**: The underlying `GeminiService` was rewritten to use `fetch` with the Gemini REST API directly, enabling support for the File API and providing more control over the request/response cycle.

## [1.4.0] - 2024-07-28

### Added

-   **Advanced Settings**: Added a collapsible "Advanced Settings" section in the source panel to configure the Gemini model name and temperature. These settings are persisted in local storage.

## [1.3.0] - 2024-07-27

### Changed

-   Improved the initial API key setup experience. Instead of a full-screen modal, a dedicated input form now appears directly in the left-hand panel if no API key is found in local storage. The full-screen modal is now only used for changing an existing key.

## [1.2.1] - 2024-07-26

### Fixed

-   Fixed a bug in the prompt history feature where the *previous* prompt was saved on every change, rather than the *current* prompt when it was used. Prompts are now correctly added to history only when a distillation process is started.

## [1.2.0] - 2024-07-25

### Added

-   `README.md` to provide a comprehensive project overview, setup instructions, and feature list.
-   `CHANGELOG.md` to track project versions and changes.
-   **Prompt History**: A history of the last 20 unique distillation prompts is now saved in local storage. A "History" button in the Source Panel opens a modal to view and select past prompts.

## [1.1.0] - 2024-07-24

### Changed

-   The distillation prompt is now saved in browser local storage, persisting across sessions.

## [1.0.0] - 2024-07-23

### Added

-   Initial release of the Book Distiller application.
-   Core features: PDF upload, customizable prompt, Autopilot distillation with Gemini, live document view, trace log, and export functionality.
-   Ability to change the Gemini API key from a settings icon in the header.
