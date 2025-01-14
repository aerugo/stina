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

  o1: {
    label: "O1",
    deployment: "o1",
    provider: "azure",
    context_length: 120000,
    system: false,
  },

  // Anthropic

  "anthropic-claude-3": {
    label: "Anthropic Claude 3",
    deployment: "claude-3-opus-20240229",
    provider: "anthropic",
    context_length: 200000,
    max_tokens: 4096,
    temperature: 0.7,
    system: true,
  },

  // Ollama

  "ollama-llama2": {
    label: "Llama 2 (Ollama)",
    deployment: "llama2",
    provider: "ollama",
    context_length: 4096,
    max_tokens: 2048,
    temperature: 0.7,
    system: true,
  },
};
