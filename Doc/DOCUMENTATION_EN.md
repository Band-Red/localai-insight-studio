# Project Documentation: LocalAI Insight Studio

## 1. Introduction

LocalAI Insight Studio is an All-in-One Local AI Development IDE. It focuses on privacy, developer productivity, and real-time model monitoring. By moving away from cloud dependencies, it provides a stable and secure environment for AI-assisted software development.

## 2. System Architecture

The application follows an Electron-based multi-process architecture:

- **Main Process (Node.js)**: Handles system-level operations, file management, model server lifecycle, and IPC communication.
- **Renderer Process (React/TS)**: Manages the User Interface, state handling, and interactive sandbox components.
- **Python Bridge**: A sidecar process that gathers real-time hardware metrics (CPU, RAM, GPU) using `psutil`.

## 3. Core Modules

### 3.1 Chat & RAG (Retrieval-Augmented Generation)

Users can chat with local models and provide context by:

- Attaching individual files (.txt, .md, .pdf, .ts, etc.).
- Selecting entire project directories.
  The system indexes these files locally and provides them as context to the AI model.

### 3.2 Model Manager (GGUF)

Built specifically for GGUF models:

- **Library**: Manage local model files.
- **Server Configuration**: Set ports, RAM/VRAM allocation, and security settings.
- **Speculative Decoding**: Configure a smaller "Draft Model" to speed up tokens-per-second on larger models.
- **MCP**: Support for Model Context Protocol servers for third-party tools.

### 3.3 Interactive Sandbox & Emulator

A unique feature that allows live previewing:

- **Web Preview**: Renders HTML/JS/CSS in an isolated iframe.
- **Visual Inspector**: Injects an inspection script into the preview. When the user clicks an element, the AI can be instructed to modify only that specific part of the code.
- **External View**: Offers a "one-click" option to open the current preview in Chrome or Edge.

### 3.4 Monitoring Dashboard

Visualizes system health and AI performance:

- High-frequency data polling via Python.
- Real-time Recharts-based visualization.
- Status indicators for hardware health.

## 4. Data Storage

LocalAI Insight Studio adheres to the **Local-First** principle:

- **No centralized database**: All state is persisted via `.json` files in `os.homedir()/.localai-insight-studio/`.
- **Obsidian Support**: Chats can be exported to standard Markdown vaults.

## 5. Development Guide

### Prerequisites

- Node.js (v18+)
- Python 3.x (with `psutil`)
- Git

### Installation

```bash
git clone <repository_url>
npm install
pip install psutil
```

### Build Commands

- `npm run dev`: Starts the development environment with build watch.
- `npm run build`: Generates the production bundle using Webpack.
- `npm run dist`: Packages the application for Windows (.exe).

---

© 2026 LocalAI Insight Studio Team
