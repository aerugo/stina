/**
 * Tokenization Module
 * Handles token estimation and message truncation.
 */
const TokenizationModule = (function () {
  /**
   * Estimates the number of tokens in the text.
   * @param {string} text - The text to estimate tokens for.
   * @returns {number} - Estimated token count.
   */
  function estimateTokens(text) {
    // Simple estimation: 1 token ~ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncates messages to fit within the model's token limit.
   * @param {Array} messages - The messages to truncate.
   * @param {number} context_length - Maximum allowed tokens.
   * @returns {Array} - The truncated messages.
   */
  function truncateMessages(messages, context_length) {
    let totalTokens = 0;
    const truncated = [];

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = estimateTokens(message.content) + 10; // Buffer for metadata
      if (totalTokens + tokens > context_length) break;
      totalTokens += tokens;
      truncated.unshift(message);
    }

    return truncated;
  }

  return {
    estimateTokens,
    truncateMessages,
  };
})();
