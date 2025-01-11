const models = {
  "gpt-4o": {
    label: "GPT-4o standard",
    deployment: "gpt-4o-3",
    maxTokens: 120000,
    temperature: 0.9,
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
    system: true,
  },
  "gpt-4o-lowtemp": {
    label: "GPT-4o lowtemp",
    deployment: "gpt-4o-3",
    maxTokens: 120000,
    temperature: 0.9,
    top_p: 0.5,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
    system: true,
  },
  o1: {
    label: "O1",
    deployment: "o1",
    maxTokens: 120000,
    stop: null,
    system: false,
  },
};
