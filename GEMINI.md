# GEMINI Project Analysis

## Project Overview

This project is a desktop application for Windows named "龟龟助手" (Turtle Assistant), which appears to be a helper tool for the game World of Warcraft. It is built using Electron as the main application framework, with a Vue.js frontend and Vite for the build tooling. The application provides features for managing game clients, downloading and installing addons, and modifying the `realmlist.wtf` file.

The application's main logic is written in JavaScript. The Electron main process code is located in `electron/index.js`, and the Vue.js frontend code is in the `src` directory. The application uses several Node.js libraries, including `electron-log` for logging, `axios` for making HTTP requests, and `element-plus` for the UI components.

## Building and Running

To build and run the project, you will need to have Node.js and npm installed.

**Running in Development Mode:**

To run the application in development mode, use the following command:

```bash
npm start
```

This will start the Vite development server for the Vue.js frontend and launch the Electron application. The application will automatically reload when you make changes to the code.

**Building for Production:**

To build a distributable version of the application for Windows, use the following command:

```bash
npm run release
```

This will create an installer for the application in the `release` directory.

## Development Conventions

*   **Frontend:** The frontend is built with Vue.js. Components are located in the `src/components` directory. The main application component is `src/App.vue`.
*   **Backend (Electron Main Process):** The Electron main process code is in `electron/index.js`. This file handles window creation, application lifecycle events, and communication with the renderer process.
*   **Inter-Process Communication (IPC):** The application uses IPC to communicate between the main and renderer processes. The preload script is located at `electron/preload.js`, and it exposes a global `electronAPI` object to the renderer process.
*   **Styling:** The application uses CSS for styling. Global styles are defined in `src/assets/styles/index.css`.
*   **Dependencies:** The project uses npm to manage its dependencies. The dependencies are listed in the `package.json` file.
