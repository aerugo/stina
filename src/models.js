var models = {
  "gpt-4o": {
    label: "GPT-4o standard",
    deployment: "gpt-4o-3",
    context_length: 120000,
    temperature: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
    system: true,
  },
  "gpt-4o-lowtemp": {
    label: "GPT-4o lowtemp",
    deployment: "gpt-4o-3",
    context_length: 120000,
    temperature: 0.5,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: null,
    system: true,
  },
  o1: {
    label: "O1",
    deployment: "o1",
    context_length: 120000,
    stop: null,
    system: false,
  },
};
