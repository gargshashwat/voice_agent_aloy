// Renderer Process JavaScript
// Now with Claude integration!

const { sendMessage } = require('../services/claude');

console.log('Aloy voice agent with Claude initialized!');

// Get references to DOM elements
const container = document.getElementById('container');
const stateTag = document.getElementById('state-tag');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

// Track current state
let currentState = 'idle';

// Track if spacebar is currently held down
let isSpacebarPressed = false;

// Store timeout IDs
let transitionTimeout = null;

// Conversation history for Claude
let conversationHistory = [];

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
 * Send message to Aloy (Claude) and get response
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

    // Send to Claude
    const response = await sendMessage(userMessage, conversationHistory);

    // Update conversation history
    conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response }
    );

    // Change to speaking state
    setState('speaking');

    // Add Aloy's response to UI
    addMessage(response, 'assistant');

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

console.log('Ready! Type a message and press Enter or click Send.');
console.log('Spacebar still works for testing state changes.');
