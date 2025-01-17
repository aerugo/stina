window.defaultModels = {
  // Azure OpenAI
  "gpt-4o": {
    label: "GPT-4o standard",
    deployment: "gpt-4o-3",
    provider: "azure",
    context_length: 120000,
    max_tokens: 8000,
    temperature: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
    system: true,
  },

  o1: {
    label: "O1",
    deployment: "o1",
    provider: "azure",
    context_length: 120000,
    system: false,
  },

  // OpenAI

  "openai-gpt-4o": {
    label: "OpenAI GPT-4o",
    deployment: "gpt-4o",
    provider: "openai",
    context_length: 100000,
    max_tokens: 8192,
    temperature: 0.9,
    system: true,
  },

  // Anthropic

  "anthropic-claude-3": {
    label: "Anthropic Claude 3.5 Sonnet",
    deployment: "claude-3-5-sonnet-latest",
    provider: "anthropic",
    context_length: 200000,
    max_tokens: 8192,
    temperature: 0.7,
    system: true,
  },

  // Ollama

  "ollama-llama2": {
    label: "Llama 3.2 (Ollama)",
    deployment: "llama3.2",
    provider: "ollama",
    context_length: 4096,
    system: true,
  },
};
