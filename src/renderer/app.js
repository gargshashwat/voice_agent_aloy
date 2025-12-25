// Renderer Process JavaScript
// Now with Claude integration + Streaming!

const { sendMessage, sendMessageStreaming } = require('../services/claude');
const { generateSummary, saveMemory, saveRawConversation, processRawConversations, clearMemories } = require('../services/memory');

console.log('Aloy voice agent with Claude initialized!');

// Process any raw conversations from previous session
// (Converts them to summaries in the background)
processRawConversations().catch(err => {
  console.error('Error processing raw conversations:', err);
});

// Get references to DOM elements
const container = document.getElementById('container');
const stateTag = document.getElementById('state-tag');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const clearMemoryBtn = document.getElementById('clear-memory-btn');

// Track current state
let currentState = 'idle';

// Track if spacebar is currently held down
let isSpacebarPressed = false;

// Store timeout IDs
let transitionTimeout = null;

// Conversation history for Claude
let conversationHistory = [];

// Track if current conversation has been saved
let lastSavedLength = 0;

/**
 * Save conversation summary to memory
 */
async function saveConversationSummary() {
  if (conversationHistory.length === 0) {
    console.log('No conversation to save');
    return;
  }

  if (conversationHistory.length === lastSavedLength) {
    console.log('Conversation already saved');
    return;
  }

  try {
    console.log('Generating conversation summary...');
    const summary = await generateSummary(conversationHistory);
    if (summary) {
      saveMemory(summary);
      lastSavedLength = conversationHistory.length;
      console.log('Conversation summary saved!');
    }
  } catch (error) {
    console.error('Error saving conversation summary:', error);
  }
}

/**
 * Change the application state
 */
function setState(newState) {
  console.log(`State: ${currentState} → ${newState}`);
  currentState = newState;
  container.dataset.state = newState;
  stateTag.textContent = newState;
  handleStateTransitions(newState);
}

/**
 * Handle automatic state transitions
 */
function handleStateTransitions(state) {
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  // For text mode, transitions are faster since we're not simulating voice
  if (state === 'thinking') {
    // Will transition to speaking when Claude responds
    // (handled in sendMessageToAloy)
  }
  else if (state === 'speaking') {
    // After showing response, return to idle
    transitionTimeout = setTimeout(() => {
      setState('idle');
    }, 2000);
  }
}

/**
 * Add a message to the chat UI
 */
function addMessage(content, role = 'user') {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;
  messageEl.textContent = content;
  messagesDiv.appendChild(messageEl);

  // Auto-scroll to bottom
  messagesDiv.scrollTop = messagesDiv.height;
}

/**
 * Send message to Aloy (Claude) with streaming
 */
async function sendMessageToAloy(userMessage) {
  if (!userMessage.trim()) return;

  try {
    // Add user message to UI
    addMessage(userMessage, 'user');

    // Clear input
    messageInput.value = '';

    // Change to thinking state
    setState('thinking');

    // Create empty message element for Aloy's response
    const aloyMessageEl = document.createElement('div');
    aloyMessageEl.className = 'message assistant';
    aloyMessageEl.textContent = '';  // Start empty
    messagesDiv.appendChild(aloyMessageEl);

    let fullResponse = '';

    // Send to Claude with streaming
    await sendMessageStreaming(
      userMessage,
      conversationHistory,
      (token) => {
        // This callback runs for each token as it arrives

        // First token - change to speaking state
        if (fullResponse === '') {
          setState('speaking');
        }

        // Append token to response
        fullResponse += token;
        aloyMessageEl.textContent = fullResponse;

        // Auto-scroll to show latest text
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      }
    );

    // Update conversation history with complete response
    conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: fullResponse }
    );

    // Save conversation summary periodically (every 6+ messages = 3+ exchanges)
    if (conversationHistory.length >= 6 && conversationHistory.length % 6 === 0) {
      await saveConversationSummary();
    }

  } catch (error) {
    console.error('Error talking to Aloy:', error);
    addMessage('Sorry, I had trouble connecting. Check your API key and internet connection.', 'system');
    setState('idle');
  }
}

/**
 * Handle send button click
 */
sendBtn.addEventListener('click', () => {
  const message = messageInput.value;
  sendMessageToAloy(message);
});

/**
 * Handle Enter key in input
 */
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const message = messageInput.value;
    sendMessageToAloy(message);
  }
});

/**
 * Handle clear memory button
 */
clearMemoryBtn.addEventListener('click', () => {
  if (confirm('This will clear all conversation memories. Are you sure?')) {
    // Clear memory file
    clearMemories();

    // Clear current conversation
    conversationHistory = [];
    lastSavedLength = 0;

    // Clear UI messages
    messagesDiv.innerHTML = '';

    // Add confirmation message
    addMessage('Memory cleared. Starting fresh!', 'system');

    console.log('Memory and conversation cleared');
  }
});

/**
 * Spacebar still works for future voice mode
 */
document.addEventListener('keydown', (event) => {
  // Ignore if typing in input
  if (document.activeElement === messageInput) {
    return;
  }

  if (event.code !== 'Space') {
    return;
  }

  event.preventDefault();

  if (isSpacebarPressed) {
    return;
  }

  if (currentState !== 'idle') {
    console.log('Cannot listen - not in idle state');
    return;
  }

  isSpacebarPressed = true;
  setState('listening');
});

document.addEventListener('keyup', (event) => {
  if (event.code !== 'Space') {
    return;
  }

  isSpacebarPressed = false;

  if (currentState === 'listening') {
    setState('thinking');
    // In voice mode, this would trigger STT → Claude
    // For now, just return to idle
    setTimeout(() => setState('idle'), 2000);
  }
});

// Save raw conversation when window is about to close
// (No async API calls - instant and reliable!)
window.addEventListener('beforeunload', (event) => {
  // Only save if there are new messages since last save
  if (conversationHistory.length > lastSavedLength && conversationHistory.length > 0) {
    saveRawConversation(conversationHistory);
  }
});

console.log('Ready! Type a message and press Enter or click Send.');
console.log('Spacebar still works for testing state changes.');
