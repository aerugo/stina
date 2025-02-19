window.additionalModels = {
  // User's custom model definitions can go here
  "gpt-4o-lowtemp": {
    label: "GPT-4o low temperature",
    deployment: "YOUR_DEPLOYMENT_NAME",
    context_length: 120000,
    max_tokens: 8000,
    temperature: 0.2,
    frequency_penalty: 0,
    presence_penalty: 0,
    system: true,
  },
  "my-weak-model": {
    label: "My Weak Model",
    deployment: "my-deployment-for-weak-model",
    provider: "azure",       // adjust if needed ("openai", "anthropic", etc.)
    context_length: 4096,
    max_tokens: 1000,
    temperature: 0.7,
    system: true,
    weak: true               // <-- New property to flag this model as weak
  },
};
