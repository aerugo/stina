# Stina AI Chat Client

<img width="1455" alt="Screenshot 2025-01-15 at 18 12 42" src="https://github.com/user-attachments/assets/382bc604-ac73-46eb-b1e6-fce83db012b5" />

Stina is a lightweight AI chat client specifically designed for environments with strict restrictions. In many government, healthcare, and large corporate settings, stringent IT policies prohibit the use of web servers, installations of new software, or access to online AI chat bots. Despite these limitations, there is often a need for advanced AI assistance within these organizations.

**Stina addresses this need by providing a client-side solution that requires no server, no installations, and no build tools.** Users can interact with powerful language models using their own API keys or a local Ollama instance, all within a secure and compliant environment.

Stina can be hosted on a SharePoint server, run directly from the filesystem, or accessed through a local web server. It supports multiple language models, custom instructions, and dynamic system prompts, making it a versatile tool for a wide range of applications.

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

## Introduction

Stina is an AI chat client built with pure JavaScript, HTML, and CSS. It is designed to function in environments where:

- A web server cannot be set up.
- No installations of software or packages are allowed.
- Usage of online AI chat bots is prohibited.
- There is access to API keys for language models or an Ollama instance.

## Features

- **No Build Dependencies**: Run directly from the filesystem without any server or installations or dependencies.
- **API Key Support**: Connect to various language models using your own API keys. Currently supports Azure AI Foundry, OpenAI, and Anthropic.
- **Ollama Integration**: Supports local language models via Ollama.
- **Dynamic System Prompts**: Configure and change system prompts (custom instructions) during conversations, allowing you to switch contexts seamlessly.
- **Model Switching**: Change between different language models in the middle of a conversation.
- **Customization**: Easily modify the code or configurations without build tools. In environments that don't support Node.js and NPM, Stina is ideal.
- **Multi-language Support**: Includes localization support for multiple languages. Currently, English and Swedish are supported.
- **SharePoint Compatibility**: Can be served through a SharePoint server by renaming `chat.html` to `chat.aspx`.
- **User-friendly Interface**: Clean and simple UI for seamless interaction.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, or Safari).
- API keys for language models (e.g., OpenAI, Azure, Anthropic) or access to an Ollama instance.

### Installation

1. **Clone or Download the Repository**

   ```bash
   git clone https://github.com/yourusername/stina.git
   ```

   Or download the ZIP file and extract it.

2. **Set Up API Keys**

   Obtain API keys from your language model provider (e.g., Azure AI Foundry, OpenAI). If using Ollama, ensure it's running locally.

## Configuration

Stina can be configured using template files or directly in the browser's local storage.

### Using Configuration Files

1. **Locate Template Files**

   - `providers.template.js`
   - `models.template.js`
   - `instructions.template.js`

2. **Create Configuration Files**

   Copy the template files and rename them:

   - `providers.template.js` → `providers.js`
   - `models.template.js` → `models.js`
   - `instructions.template.js` → `instructions.js`

3. **Edit Configuration Files**

   - **providers.js**: Enable providers and insert your API keys and endpoints.

     ```javascript
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
       ollama: {
         enabled: false,
         endpoint: "http://localhost:11434",
       },
       anthropic: {
         enabled: false,
         apiKey: "",
       },
     };
     ```

   - **models.js**: Define custom models or override existing ones. Stina currently only supports setting model configurations through the models file. If you need models with differnt temperature, max tokens, or context length, you can add them here.

     ```javascript
     window.additionalModels = {
       "gpt-4-custom": {
         label: "GPT-4 Custom",
         deployment: "your-deployment-name",
         provider: "azure",
         context_length: 8000,
         max_tokens: 2000,
         temperature: 0.7,
         system: true,
       },
     };
     ```

   - **instructions.js**: Add additional assistant instructions.

     ```javascript
     window.additionalInstructions = [
       {
         id: "custom_instructor",
         order: 3,
         label: "Custom Instructor",
         content: "Provide guidance in a friendly and concise manner.",
       },
     ];
     ```

### In-Memory Configuration

If you cannot use configuration files, Stina allows setting configurations in memory through the settings UI.

1. **Open Stina**: Open `chat.html` in your web browser.
2. **Access Settings**: Click on the `Settings` button in the top navigation bar.
3. **Configure Providers**: In the `Providers` section, enable the desired providers and input your API keys and endpoints.
4. **Set Language**: Navigate to the `Language` tab to change the interface language.
5. **Save Changes**: Click `Save Changes` to apply the configurations.

**Note**: In-memory configurations are stored in the browser's local storage and will persist across sessions on the same machine and browser.

### Configuring Azure AI Foundry with User-Provided API Keys

In environments where the Azure AI Foundry endpoint is shared, but each user must provide their own API key (e.g., to ensure that only cleared users can access the API), you can set up Stina to use a common endpoint while requiring individual users to input their own API keys.

**Steps to Configure:**

1. **Edit `providers.js`**

   - Copy `providers.template.js` to `providers.js` if you haven't already.
   - Set up the Azure provider with the shared endpoint and leave the `apiKey` field empty or omit it entirely.

   ```javascript
   window.providerConfigs = {
     azure: {
       enabled: true,
       endpoint: "https://YOUR_RESOURCE_NAME.openai.azure.com",
       // No apiKey provided here to require users to input their own
     },
     openai: {
       enabled: false,
     },
     ollama: {
       enabled: false,
     },
     anthropic: {
       enabled: false,
     },
   };
   ```

2. **User Instructions**

   - **Open Stina**: Users open `chat.html` in their web browser.
   - **Access Settings**: Click on the `Settings` button in the top navigation bar.
   - **Enter API Key**:
     - Navigate to the `Providers` tab if not already there.
     - Locate the Azure provider configuration.
     - Enter their personal Azure AI Foundry API key in the `API Key` field.
   - **Save Changes**: Click `Save Changes` to store the API key securely in the browser's local storage.

**Benefits of This Configuration**:

- **Security Compliance**: Only authorized users with valid API keys can access the AI services, adhering to organizational security policies.
- **Centralized Endpoint Management**: The endpoint is pre-configured, reducing setup complexity for individual users.
- **User Accountability**: Each user is responsible for their own API key, ensuring traceability and accountability.

**Notes**:

- **API Key Security**: Users should keep their API keys confidential and avoid sharing them.
- **Local Storage**: The API key is stored in the browser's local storage and is not transmitted or shared.
- **Provider Configuration**: Ensure that other providers are disabled if not in use, to prevent unauthorized access.

## Usage

### Running Stina

1. **Open the Application**

   - Double-click on `chat.html` to open it in your default web browser.
   - Alternatively, open the file from within your browser by navigating to `File` → `Open File`.

2. **Initial Setup**

   - Upon first launch, you may need to configure your providers if not using configuration files.

### Using Features

- **Starting a New Chat**

  - Click on the `New Chat` button to start a fresh conversation.

- **Sending Messages**

  - Type your message in the input box at the bottom and press `Enter` or click the `Send` button.

- **Switching Models**

  - Use the model selector in the toolbar below the input box to change the language model.

- **Using Instructions**

  - Select predefined instructions to guide the assistant's behavior.
  - Create custom instructions by selecting `Create new instruction...` from the instructions dropdown.

- **Managing Chats**

  - All active chats are listed in the sidebar. Click on a chat to switch to it.
  - Delete a chat by clicking the `×` button next to the chat name in the sidebar.

- **Settings**

  - Access settings to configure providers, API keys, endpoints, and language preferences.

### Example: Collaborating with Mini-Agents

One of the powerful features of Stina is the ability to define and interact with multiple specialized "mini-agents" within a single conversation. By switching between custom instructions and models, you can simulate a collaborative environment with experts in different domains.

#### Step-by-Step Usage Example

<img width="892" alt="Screenshot 2025-01-15 at 18 11 49" src="https://github.com/user-attachments/assets/1fb31c50-266d-4f7a-9948-f8a560c37ca7" />

**Objective**: You are working on drafting a technical policy document and need input from both a technical expert and a legal expert.

1. **Create Custom Instructions**

   - **Technical Expert**

     - Go to the instructions dropdown below the input box.
     - Select **Create new instruction...**.
     - In the modal that appears, fill in:
       - **Title**: `Technical Expert`
       - **Content**:
         ```
         You are a technical expert specializing in network security and infrastructure. Provide detailed technical insights and recommendations.
         ```
     - Click **Save**.

   - **Legal Expert**

     - Repeat the above steps to create another instruction:
       - **Title**: `Legal Expert`
       - **Content**:
         ```
         You are a legal expert with knowledge in corporate law and compliance. Provide legal advice and ensure all recommendations adhere to regulatory standards.
         ```
     - Click **Save**.

2. **Start the Conversation**

   - **Select the Technical Expert**

     - In the instructions dropdown, select **Technical Expert**.

   - **Interact with the Technical Expert**

     - Ask your technical questions, for example:
       ```
       What are the best practices for securing our network infrastructure against cyber attacks?
       ```
     - Receive detailed technical advice from the assistant.

3. **Switch to the Legal Expert**

   - **Change the Instruction**

     - In the instructions dropdown, select **Legal Expert**.

   - **Interact with the Legal Expert**

     - Ask your legal questions, for example:
       ```
       Are there any compliance issues we need to be aware of when implementing these security measures?
       ```
     - Receive legal guidance from the assistant.

4. **Switch Between Models (Optional)**

   - If you have different models configured that are better suited for technical or legal advice, you can switch between them:

     - Use the model selector to choose the appropriate model at any time.

5. **Continue the Conversation**

   - **Iterate as Needed**

     - Continue switching between the **Technical Expert** and **Legal Expert** as your conversation progresses.
     - Refine your document based on the insights provided.

6. **Save or Export Your Conversation**

   - **Preserve the Discussion**

     - Your conversation, along with the context of each mini-agent, is saved within the chat session.
     - You can refer back to previous messages or export the conversation as needed.

**Benefits of This Approach**:

- **Contextual Expertise**: Tailor the assistant's knowledge to specific domains by defining custom instructions.
- **Dynamic Switching**: Seamlessly switch between different experts without starting new chats.
- **Efficiency**: Consolidate all relevant discussions into a single conversation for easy reference.
- **Flexibility**: Adjust instructions and models on the fly to adapt to your evolving needs.

**Note**: The assistant maintains the conversation history, so even when you switch instructions or models, it retains the context from previous messages. This allows for coherent and continuous dialogue across different domains.

## Customization

Stina is designed to be easily customizable, allowing you to tailor it to your specific needs.

### Adding Custom Instructions

1. **Through the Application**

   - In the instructions dropdown, select `Create new instruction...`.
   - Provide a title and content for your instruction.
   - Save the instruction to have it available in the dropdown menu.

2. **Using `instructions.js`**

   - If you have access to the filesystem, edit `instructions.js` to add custom instructions.

   - Example:

     ```javascript
     window.additionalInstructions = [
       {
         id: "friendly-assistant",
         order: 4,
         label: "Friendly Assistant",
         content: "You are a friendly assistant who provides helpful and kind responses.",
       },
     ];
     ```

### Adding Custom Models

1. **Using `models.js`**

   - Copy `models.template.js` to `models.js`.
   - Add your custom model configurations as shown:

     ```javascript
     window.additionalModels = {
       "custom-model": {
         label: "Custom Model",
         deployment: "your-deployment-name",
         provider: "openai",
         max_tokens: 1500,
         temperature: 0.5,
         system: true,
       },
     };
     ```

**Note**: Customization through files requires access to modify files on the filesystem.

## Data Privacy

Stina is designed with privacy in mind. All chat history and user data are stored **only** in the browser's local storage. This means:

- **Local Storage**: Your conversations are kept locally on your machine within your browser's storage.
- **No Server Transmission**: Messages are not sent to or stored on any servers beyond what is necessary to communicate with the AI API endpoints you have configured.
- **Session Persistence**: Your chat history is preserved between sessions on the same machine and browser.
- **Data Control**: You have full control over your data. Clearing your browser's cache or local storage will permanently delete your chat history.

**Note**: Be cautious when using shared or public computers. Other users with access to the same machine and browser may be able to view your chat history stored in the local storage.

## Accessing Through SharePoint

If you need to share Stina via SharePoint:

1. **Rename File**

   - Rename `chat.html` to `chat.aspx`.

2. **Upload to SharePoint**

   - Add the `chat.aspx` file and all associated resources to your SharePoint document library.

3. **Access the Application**

   - Navigate to the `chat.aspx` file in SharePoint to run the application.

**Note**: Ensure that all script files and assets are uploaded and accessible in the same directory structure.

## Planned Features

Stina is a work in progress, maintained in collaboration with the community. Here are some planned features and enhancements:

- **Export and Import Conversations**: Implement the ability to export and import conversations using YAML files for easy sharing and backup.
- **File Upload Support**: Enable users to upload files, extract text from PDFs and other documents, and use vision models for image processing.
- **In-Memory Vector Databases**: Consider integrating in-memory vector databases to allow adding large numbers of files or large documents, enabling in-memory Retrieval-Augmented Generation (RAG) within conversations.
- **Additional Providers**: Extend support for more AI providers to offer users a wider range of models and services.


## Contributing

Contributions are welcome! We are eager to collaborate with the community to implement new features and improve Stina. If you're interested in working on any of the planned features or have ideas of your own, please follow these steps:

1. **Fork the Repository**

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Commit Your Changes**

   ```bash
   git commit -am 'Add new feature: Your Feature Name'
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**

   - Provide a clear description of your changes and indicate which planned feature you are contributing to.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
