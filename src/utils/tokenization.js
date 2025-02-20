/**
 * Tokenization Module
 * Wraps GPT-tokenizer (if present) behind a general API.
 */
const TokenizationModule = (function () {
  // Check if GPTTokenizer for cl100k_base is loaded in the global scope
  const isGptTokenizerAvailable = (typeof GPTTokenizer_cl100k_base !== "undefined");

  /**
   * Counts tokens using GPT-tokenizer if available.
   * @param {string} text
   * @returns {number} Token count
   */
  function gptCountTokens(text) {
    const tokens = GPTTokenizer_cl100k_base.encode(text);
    return tokens.length;
  }

  /**
   * Fallback token estimation (naive: 1 token ~ 4 characters).
   * @param {string} text
   * @returns {number} Estimated token count
   */
  function fallbackCountTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Public method: counts tokens using GPT if possible, otherwise falls back.
   * @param {string} text
   * @returns {number} Token count
   */
  function countTokens(text) {
    return isGptTokenizerAvailable ? gptCountTokens(text) : fallbackCountTokens(text);
  }

  /**
   * (Optional) Existing naive estimate.
   * @param {string} text
   * @returns {number}
   */
  function estimateTokens(text) {
    return fallbackCountTokens(text);
  }

  function truncateMessages(messages, context_length) {
    let totalTokens = 0;
    const truncated = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      // You may switch to countTokens here if desired:
      const tokens = countTokens(message.content) + 10;
      if (totalTokens + tokens > context_length) break;
      totalTokens += tokens;
      truncated.unshift(message);
    }

    return truncated;
  }

  return {
    countTokens,        // Uses GPT if available, else fallback.
    estimateTokens,     // Naive estimate.
    truncateMessages,
  };
})();
