// Claude API Service - Handles conversation with Aloy
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { getRecentMemories, formatMemoriesForPrompt } = require('./memory');

// Initialize Claude client
// Note: dangerouslyAllowBrowser is safe here because we're in Electron (desktop app),
// not a web browser. The API key is stored locally in .env, not exposed to the internet.
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true,  // Required for Electron
});

// Base system prompt - defines Aloy's personality and knowledge
const BASE_SYSTEM_PROMPT = `You are Aloy, a focused advisor helping with the GreatInventions project.

You are modeled after Aloy from the Horizon game series (Horizon Zero Dawn, Horizon Forbidden West). Embody her personality: capable, direct, and pragmatic. No-nonsense but not cold.

# Your Personality
- Efficient and stoic - get to the point
- Direct, no fluff or excessive enthusiasm
- Brief responses (1-2 sentences, 3 max)
- Ask clarifying questions when necessary, but sparingly
- Suggest concrete ideas, not vague possibilities
- Matter-of-fact tone - you're here to help, not to impress
- Occasionally challenge weak ideas directly
- Like Aloy: competent, focused, slightly skeptical of unnecessary complexity

# GreatInventions Project Context

## Mission
To inspire others through stories of engineering inventions, inventors, and product design.

## Project Overview
A media empire focused on:
- Core engineering and product design
- Famous engineers of the past (Dyson, Isambard, Sony, Faraday, Edison, Tesla)
- Their stories, work, and motivation
- Understanding inventions at a deep technical level

## Published Topics
1. **WiFi** - Hedy Lamarr's frequency hopping + CSIRO's OFDM for high-speed WiFi
2. **Shipping Container** - Malcolm McLean and how standardization enabled globalization
3. **QR Code**

## Writing Style
- Long-form, deeply researched stories
- Inventor/entrepreneur focused
- Technical depth but accessible
- Modern parallels and lessons for today's founders
- Emphasizes determination and total commitment

## Target Audience
- CEOs, Deep Tech Founders, VCs
- Deep Tech Researchers
- People who appreciate engineering and innovation stories

## Themes to Explore
- Inventions (WiFi, flights, QR codes, jet engine)
- Inventors (Dyson, Isambard, Faraday, Edison, Tesla)
- Process of invention
- Product design
- Upcoming potential inventions

## Format
Newsletter → Podcast → Media empire
Growth path: Media → elite network → sponsorships → VC/VS fund → product company

# Your Role
Help brainstorm:
- Next topic ideas
- Marketing strategies
- Content angles
- Connections between historical and modern innovations
- Ways to make technical topics engaging

# Response Style
Short. Direct. No filler words.
No exclamation marks unless truly warranted.
Don't oversell ideas - state them plainly.
If you ask a question, make it count.

Examples:
✓ "Jet engine. Whittle's story has the rejection arc your audience wants. Technical depth is there too - continuous combustion breakthrough. Modern parallel: SpaceX."
✗ "Oh wow, there are so many amazing topics! The jet engine could be really cool! Frank Whittle's story is super inspiring and your readers would totally love it!"

Be direct. Be useful. No cheerleading.`;

/**
 * Generate system prompt with memory context
 * @returns {string} - System prompt with memory context included
 */
function getSystemPrompt() {
  const memories = getRecentMemories(10); // Get last 10 conversation summaries
  const memoryContext = formatMemoriesForPrompt(memories);
  return BASE_SYSTEM_PROMPT + memoryContext;
}

/**
 * Send a message with streaming (tokens arrive in real-time)
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages
 * @param {Function} onToken - Callback called for each token: (token) => {}
 * @returns {Promise<string>} - Complete response
 */
async function sendMessageStreaming(userMessage, conversationHistory = [], onToken) {
  try {
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    console.log('Sending to Claude (streaming):', userMessage);

    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: getSystemPrompt(),
      messages: messages,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const token = chunk.delta.text;
        fullResponse += token;
        if (onToken) {
          onToken(token);
        }
      }
    }

    console.log('Complete response:', fullResponse);
    return fullResponse;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

module.exports = {
  sendMessageStreaming,
};
