# Stina AI Chat Client

<img width="1455" alt="Screenshot 2025-01-15 at 18 12 42" src="https://github.com/user-attachments/assets/382bc604-ac73-46eb-b1e6-fce83db012b5" />

Stina is a **lightweight AI chat client** specifically designed for environments with strict security or IT restrictions. In government, healthcare, and large corporate settings, installing servers or external dependencies is often **not allowed**; internet access to AI services might be heavily controlled, and only certain APIs or local LLMs (like [Ollama](https://github.com/jmorganca/ollama)) can be used.

**Stina requires no server, no software installation, and no build tools**—just download the repository and open `chat.html` in a modern browser. You can still configure advanced setups via optional JavaScript config files or by editing settings in the UI. Stina supports **multiple LLM providers** (Azure, OpenAI, Anthropic, Ollama), **custom instructions**, dynamic system prompts, and **SharePoint** compatibility.

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Configuration](#configuration)
  - [Using Configuration Files](#using-configuration-files)
  - [In-Memory Configuration](#in-memory-configuration)
  - [Configuring Azure AI Foundry with User-Provided API Keys](#configuring-azure-ai-foundry-with-user-provided-api-keys)
- [Usage](#usage)
  - [Running Stina](#running-stina)
  - [Using Features](#using-features)
  - [Example: Collaborating with Mini-Agents](#example-collaborating-with-mini-agents)
- [Customization](#customization)
  - [Adding Custom Instructions](#adding-custom-instructions)
  - [Adding Custom Models](#adding-custom-models)
- [Data Privacy](#data-privacy)
- [Accessing Through SharePoint](#accessing-through-sharepoint)
- [Planned Features](#planned-features)
- [Contributing](#contributing)
- [License](#license)
- [Bundled Libraries and Credits](#bundled-libraries-and-credits)

---

## Introduction

Stina is an AI chat client built with **pure JavaScript, HTML, and CSS**—no Node.js or build step required. Its key design goals:

- **Run from the local filesystem** (open `chat.html` directly). 
- **Zero server dependencies**—everything is processed client-side, except for calls to your chosen LLM endpoints (Azure, OpenAI, etc.).
- **Strict-environment friendly**—ideal for locked-down enterprise or government setups.
- **Ollama integration**—use local LLMs if you have Ollama running on your machine.

---

## Features

- **No Build Dependencies**: Simply download and open `chat.html`. No server or package installations are needed.
- **API Key Support**: Connect to Azure AI Foundry, OpenAI, Anthropic, or other providers using your own keys.
- **Ollama Integration**: Run local language models if you have [Ollama](https://github.com/jmorganca/ollama) installed.
- **Dynamic System Prompts (Instructions)**: Edit or add new instructions to change the assistant’s behavior on the fly.
- **Multiple Models**: Switch to different models mid-chat (e.g., from GPT-4 to GPT-3.5 or a local model).
- **Multi-language UI**: English and Swedish translations are included by default.
- **SharePoint Compatibility**: Rename `chat.html` to `chat.aspx` and upload to SharePoint if that’s your environment.
- **User-Friendly**: A simple, clean interface with a sidebar of chats, an input area, and a customizable prompt toolbar.

---

## Getting Started

### Prerequisites

- A **modern web browser** (Chrome, Firefox, Edge, or Safari).  
- (Optional) **API keys** for your desired LLM provider(s) (Azure, OpenAI, Anthropic).  
- (Optional) A **local Ollama instance** if you want to run local LLMs.

### Installation

1. **Clone or Download** this repository:
   ```bash
   git clone https://github.com/yourusername/stina.git
   ```
   or download the ZIP and extract it.

2. **(Optional) Add Keys/Configs**: If you wish to predefine providers or instructions, see [Using Configuration Files](#using-configuration-files).

3. **Open `chat.html`**: 
   - **Directly**: Double-click `chat.html` or select “File > Open...” in your browser.
   - If your browser blocks local file scripts for security reasons, you can:
     - Change local security settings, or
     - Temporarily serve the folder via a minimal local server (e.g., `python -m http.server 8080`) and visit `http://localhost:8080/chat.html`.
   - If you are on a closed network that supports SharePoint, see [Accessing Through SharePoint](#accessing-through-sharepoint).

---

## Configuration

Stina can pull configuration from optional JavaScript files **or** from local storage via the UI. This helps in strict environments: you can either edit the code or just do everything in-memory via a “Settings” modal.

### Using Configuration Files

1. **Locate Template Files** (if provided or in your custom fork):
   - `providers.template.js`
   - `models.template.js`
   - `instructions.template.js`

2. **Create Actual Configuration Files**:
   - `providers.template.js` → `providers.js`
   - `models.template.js` → `models.js`
   - `instructions.template.js` → `instructions.js`

3. **Edit Configuration**:
   - **providers.js**: Enable/disable providers and insert your API keys/endpoints:
     ```js
     window.providerConfigs = {
       azure: {
         enabled: true,
         endpoint: "https://YOUR_RESOURCE_NAME.openai.azure.com",
         apiKey: "YOUR_AZURE_API_KEY",
       },
       openai: {
         enabled: false,
         apiKey: "YOUR_OPENAI_API_KEY",
       },
       // ...
     };
     ```
   - **models.js**: Add or override model definitions, including temperature, max tokens, etc.:
     ```js
     window.additionalModels = {
       "gpt-4-custom": {
         label: "GPT-4 Custom",
         deployment: "your-azure-deployment",
         provider: "azure",
         context_length: 8000,
         max_tokens: 2000,
         temperature: 0.7,
         system: true,
       },
     };
     ```
   - **instructions.js**: Add additional instructions or system prompts:
     ```js
     window.additionalInstructions = [
       {
         id: "custom_instructor",
         order: 3,
         label: "Custom Instructor",
         content: "Provide guidance in a friendly, concise manner.",
       },
     ];
     ```

### In-Memory Configuration

If you cannot create/edit local files or prefer not to:

1. **Open Stina**—just open `chat.html` in your browser.
2. **Click “Settings”** (top-right gear icon).
3. **Providers** tab:
   - Enable providers and enter your keys/URLs.  
4. **Language** tab:
   - Switch the UI between English and Swedish (or your custom translations if added).  
5. **Data** tab:
   - Import/export chats, clear all local storage, etc.

These **in-memory** settings are stored in your browser’s **IndexedDB** (and partially local storage). They persist for that browser/profile on the same machine.

### Configuring Azure AI Foundry with User-Provided API Keys

You can set up a **common Azure endpoint** but require each user to enter their own API key:

1. **Edit `providers.js`**:
   ```js
   window.providerConfigs = {
     azure: {
       enabled: true,
       endpoint: "https://YOUR_RESOURCE_NAME.openai.azure.com",
       // Omit apiKey so each user enters their own
     },
     openai: { ... },
     // ...
   };
   ```
2. **User Steps**:
   - **Open** `chat.html` → **Settings** → **Providers** → **Azure** → input personal `apiKey`.
   - **Save** → The key is stored locally in that user’s browser.

**Advantages**:  
- Maintains **security** by not bundling any shared key.  
- Centralizes the endpoint while letting each user handle their own credentials.

---

## Usage

### Running Stina

1. **Open `chat.html`** in your browser.
2. **Initial Setup**:
   - If you do not have any config files, you may need to add your keys in **Settings**.

### Using Features

- **New Chat**:
  - Click **New Chat** in the navbar. 
- **Sending Messages**:
  - Type in the bottom input box; press **Enter** or click **Send**.
- **Switching Models**:
  - Use the **model selector** in the toolbar beneath the input to switch LLMs.
- **Instructions (System Prompts)**:
  - Drop down the **instructions** menu. Choose an existing prompt or select `Create new instruction...`.
- **Sidebar Management**:
  - All chats are listed in the **left sidebar**. Click to switch; click `×` to delete.
- **Settings**:
  - Configure providers, API keys, endpoints, language, etc.

### Example: Collaborating with Mini-Agents

<img width="892" alt="Screenshot 2025-01-15 at 18 11 49" src="https://github.com/user-attachments/assets/1fb31c50-266d-4f7a-9948-f8a560c37ca7" />

**Scenario**: You want input from both a technical specialist and a legal specialist in the same conversation.

1. **Create Instructions**  
   - “Technical Expert” → a prompt for network security topics.  
   - “Legal Expert” → a prompt for regulatory compliance.

2. **Select Technical Expert**  
   - Send questions on infrastructure best practices; get specialized answers.

3. **Switch to Legal Expert**  
   - In the instructions dropdown, pick “Legal Expert.” Ask about compliance or privacy regulations.

4. **Switch Models (optional)**  
   - If you have different models for different tasks, select them in the model dropdown.

5. **Continue**  
   - The chat retains context. You can jump back to the “Technical Expert” at any time.

6. **Export**  
   - In **Settings** > **Data** > Export Chat, you can save the conversation as JSON.

**Benefit**: You effectively have **two different system prompts** in the same conversation, letting you switch roles fluidly.

---

## Customization

### Adding Custom Instructions

1. **In the UI**:  
   - `Create new instruction...` from the instructions dropdown → name it, write content, save.
2. **Using `instructions.js`** (filesystem approach):  
   ```js
   window.additionalInstructions = [
     { 
       id: "friendly-assistant", 
       order: 4, 
       label: "Friendly Assistant", 
       content: "Provide kind, helpful responses."
     }
   ];
   ```

### Adding Custom Models

1. **Using `models.js`**:
   ```js
   window.additionalModels = {
     "custom-model": {
       label: "Custom Model",
       deployment: "gpt-3.5-mydeployment",
       provider: "openai",
       max_tokens: 1500,
       temperature: 0.5,
       system: true
     }
   };
   ```

If you have `providers.js` set up, ensure that `custom-model` references a provider that’s enabled.

---

## Data Privacy

- **Local Storage**: Chat history, instructions, and configurations persist in your **browser’s IndexedDB**. 
- **No Server**: No messages or data are sent to any server outside of calls to the configured LLM endpoints. 
- **Self-Control**: You can clear all data in **Settings** > **Data** or by clearing your browser’s storage.

*Note: On shared machines, other users with the same browser profile could access your stored data.*

---

## Accessing Through SharePoint

If you need to **host Stina on SharePoint**:

1. Rename `chat.html` to `chat.aspx`.
2. Upload `chat.aspx` and all `src/` files to your SharePoint document library, preserving their structure.
3. Access the `.aspx` page in SharePoint to run Stina.

---

## Planned Features

- **Export/Import**: More robust import/export (JSON or YAML).  
- **Advanced File Upload**: Parse PDFs, DOCX (partially supported now), images, or entire knowledge bases.  
- **Vector Database**: Possibly store large doc sets for advanced retrieval-augmented generation.  
- **Additional Providers**: Add more LLM endpoints as usage demands.

---

## Contributing

We welcome community contributions! Feel free to:

1. **Fork** the repo.  
2. **Create a branch** (`feature/your-feature`).  
3. **Commit and push** changes.  
4. **Open a Pull Request**, describing your feature or fix.

---

## License

Stina is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Bundled Libraries and Credits

Stina includes or references:

- **Bulma** (MIT License): CSS framework for styling.  
  <https://bulma.io>  
- **Marked.js** (MIT License): Fast, lightweight Markdown parser.  
  <https://marked.js.org>  
- **DOMPurify** (Apache License 2.0): Sanitizes HTML for security.  
  <https://github.com/cure53/DOMPurify>  
- **highlight.js** (BSD-3-Clause License): Syntax highlighting in code blocks.  
  <https://highlightjs.org>  
- **PDF.js** (Apache License 2.0): PDF parsing.  
  <https://mozilla.github.io/pdf.js>  
- **Mammoth.js** (BSD-2-Clause License): DOCX conversion.  
  <https://github.com/mwilliamson/mammoth.js>  
- **GPT Tokenizer** (various open licenses): GPT token counting.  

All trademarks are the property of their respective owners. Contributions and issues are welcome!  