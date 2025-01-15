# Stina AI Chat Client

Stina is a lightweight AI chat client specifically designed for environments with strict restrictions. In many government, healthcare, and large corporate settings, stringent IT policies prohibit the use of web servers, installations of new software, or access to online AI chat bots. Despite these limitations, there is often a need for advanced AI assistance within these organizations.

**Stina addresses this need by providing a client-side solution that requires no server, no installations, and no build tools.** Users can interact with powerful language models using their own API keys or a local Ollama instance, all within a secure and compliant environment.

Hosting Stina on platforms like SharePoint enhances accessibility within intranet systems commonly used in such settings. This makes Stina an invaluable tool for organizations looking to leverage AI capabilities without violating internal policies.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Configuration](#configuration)
  - [Using Configuration Files](#using-configuration-files)
  - [In-Memory Configuration](#in-memory-configuration)
- [Usage](#usage)
  - [Running Stina](#running-stina)
  - [Using Features](#using-features)
  - [Example: Collaborating with Mini-Agents](#example-collaborating-with-mini-agents)
- [Customization](#customization)
  - [Adding Custom Instructions](#adding-custom-instructions)
  - [Adding Custom Models](#adding-custom-models)
- [Accessing Through SharePoint](#accessing-through-sharepoint)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Stina is an AI chat client built with pure JavaScript, HTML, and CSS. It is designed to function in environments where:

- A web server cannot be set up.
- No installations of software or packages are allowed.
- Usage of online AI chat bots is prohibited.
- There is access to API keys for language models or an Ollama instance.

## Features

- **No Build Dependencies**: Run directly from the filesystem without any server or installations. Stina currently relies on some libraries over CDNs, but these can be replaced with local copies if needed.
- **API Key Support**: Connect to various language models using your own API keys. Currently supports Azure AI Foundry, OpenAI, and Anthropic.
- **Ollama Integration**: Supports local language models via Ollama.
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

## Accessing Through SharePoint

If you need to share Stina via SharePoint:

1. **Rename File**

   - Rename `chat.html` to `chat.aspx`.

2. **Upload to SharePoint**

   - Add the `chat.aspx` file and all associated resources to your SharePoint document library.

3. **Access the Application**

   - Navigate to the `chat.aspx` file in SharePoint to run the application.

**Note**: Ensure that all script files and assets are uploaded and accessible in the same directory structure.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. **Fork the Repository**

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/new-feature
   ```

3. **Commit Your Changes**

   ```bash
   git commit -am 'Add new feature'
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/new-feature
   ```

5. **Open a Pull Request**

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

I hope this README provides a comprehensive guide to using and customizing Stina. Feel free to reach out if you have any questions or need further assistance.
