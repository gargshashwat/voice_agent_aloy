// Memory Service - Manages conversation summaries
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, '../../conversations/memory.json');

// Initialize Claude client for summary generation
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * Load all conversation summaries from memory.json
 * @returns {Array} - Array of conversation summaries
 */
function loadMemories() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) {
      // Create empty memory file if it doesn't exist
      const emptyMemory = { conversations: [] };
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(emptyMemory, null, 2));
      return [];
    }

    const data = fs.readFileSync(MEMORY_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.conversations || [];
  } catch (error) {
    console.error('Error loading memories:', error);
    return [];
  }
}

/**
 * Get the last N conversation summaries
 * @param {number} count - Number of recent summaries to get (default: 10)
 * @returns {Array} - Recent conversation summaries
 */
function getRecentMemories(count = 10) {
  const memories = loadMemories();
  return memories.slice(-count); // Get last N summaries
}

/**
 * Save a new conversation summary to memory.json
 * @param {Object} summary - Conversation summary object
 */
function saveMemory(summary) {
  try {
    const memories = loadMemories();
    memories.push(summary);

    const data = { conversations: memories };
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
    console.log('Memory saved successfully');
  } catch (error) {
    console.error('Error saving memory:', error);
  }
}

/**
 * Save raw conversation messages (used on app close - instant, no API call)
 * @param {Array} conversationHistory - Array of messages [{role, content}]
 */
function saveRawConversation(conversationHistory) {
  if (conversationHistory.length === 0) return;

  const rawEntry = {
    type: 'raw',
    date: new Date().toISOString(),
    messageCount: conversationHistory.length,
    messages: conversationHistory,
  };

  saveMemory(rawEntry);
  console.log('Raw conversation saved');
}

/**
 * Generate a conversation summary using Claude
 * @param {Array} conversationHistory - Array of messages [{role, content}]
 * @returns {Promise<Object>} - Summary object with date, topics, ideas, etc.
 */
async function generateSummary(conversationHistory) {
  try {
    const summaryPrompt = `Analyze this conversation and create a concise summary. Focus on:
- Main topics discussed
- Key ideas or suggestions generated
- Any decisions or action items
- User's interests and priorities

Keep it brief (3-5 sentences total). Be direct and factual.

Conversation:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: summaryPrompt }],
    });

    const summaryText = response.content[0].text;

    // Create summary object
    const summary = {
      type: 'summary',
      date: new Date().toISOString(),
      messageCount: conversationHistory.length,
      summary: summaryText,
    };

    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
}

/**
 * Process any raw conversation entries and convert them to summaries
 * Called on app startup
 */
async function processRawConversations() {
  const memories = loadMemories();
  let hasChanges = false;

  for (let i = 0; i < memories.length; i++) {
    if (memories[i].type === 'raw') {
      console.log(`Processing raw conversation from ${memories[i].date}...`);

      const summary = await generateSummary(memories[i].messages);
      if (summary) {
        // Replace raw entry with summary
        memories[i] = summary;
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    const data = { conversations: memories };
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
    console.log('Raw conversations processed and converted to summaries');
  }
}

/**
 * Reset/clear all memories (useful for testing)
 */
function clearMemories() {
  try {
    const emptyMemory = { conversations: [] };
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(emptyMemory, null, 2));
    console.log('Memories cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing memories:', error);
    return false;
  }
}

/**
 * Format memories for inclusion in system prompt
 * @param {Array} memories - Array of conversation summaries
 * @returns {string} - Formatted memory context
 */
function formatMemoriesForPrompt(memories) {
  if (!memories || memories.length === 0) {
    return '';
  }

  // Only include summarized entries (skip raw ones)
  const summarized = memories.filter(mem => mem.type === 'summary' || !mem.type);

  if (summarized.length === 0) {
    return '';
  }

  const formatted = summarized.map((mem, idx) => {
    const date = new Date(mem.date).toLocaleDateString();
    return `[${date}] ${mem.summary}`;
  }).join('\n\n');

  return `\n\n# Previous Conversations\n${formatted}`;
}

module.exports = {
  loadMemories,
  getRecentMemories,
  saveMemory,
  saveRawConversation,
  generateSummary,
  processRawConversations,
  clearMemories,
  formatMemoriesForPrompt,
};
