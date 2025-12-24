// Renderer Process JavaScript
// This runs in the browser environment (like a normal website)

console.log('Aloy voice agent initialized!');

// Get references to DOM elements
const container = document.getElementById('container');
const stateTag = document.getElementById('state-tag');

// Track current state
let currentState = 'idle';

// Track if spacebar is currently held down (prevent multiple triggers)
let isSpacebarPressed = false;

// Store timeout IDs so we can cancel them if needed
let transitionTimeout = null;

/**
 * Change the application state
 * @param {string} newState - One of: 'idle', 'listening', 'thinking', 'speaking'
 */
function setState(newState) {
  console.log(`State: ${currentState} → ${newState}`);

  currentState = newState;

  // Update the container's data-state attribute
  // This changes the --current-color CSS variable for both orb and tag
  container.dataset.state = newState;

  // Update the text in the state tag
  stateTag.textContent = newState;

  // Handle automatic transitions based on new state
  handleStateTransitions(newState);
}

/**
 * Handle automatic state transitions
 */
function handleStateTransitions(state) {
  // Clear any pending transitions
  if (transitionTimeout) {
    clearTimeout(transitionTimeout);
    transitionTimeout = null;
  }

  // Automatic transitions
  if (state === 'thinking') {
    // After 1 second of "thinking", start "speaking"
    // (Later: this will be when Claude finishes generating response)
    transitionTimeout = setTimeout(() => {
      setState('speaking');
    }, 1000);
  }
  else if (state === 'speaking') {
    // After 2 seconds of "speaking", return to "idle"
    // (Later: this will be when TTS audio finishes playing)
    transitionTimeout = setTimeout(() => {
      setState('idle');
    }, 2000);
  }
}

/**
 * Handle spacebar press - start listening
 */
document.addEventListener('keydown', (event) => {
  // Only respond to spacebar
  if (event.code !== 'Space') {
    return;
  }

  // Prevent default spacebar behavior (page scrolling)
  event.preventDefault();

  // Prevent repeated firing while holding spacebar
  if (isSpacebarPressed) {
    return;
  }

  // Only allow listening if we're in idle state
  if (currentState !== 'idle') {
    console.log('Cannot listen - not in idle state');
    return;
  }

  isSpacebarPressed = true;
  setState('listening');
});

/**
 * Handle spacebar release - start thinking/processing
 */
document.addEventListener('keyup', (event) => {
  // Only respond to spacebar
  if (event.code !== 'Space') {
    return;
  }

  // Reset the flag
  isSpacebarPressed = false;

  // Only transition if we're currently listening
  if (currentState === 'listening') {
    setState('thinking');
  }
});

console.log('Ready! Press and hold SPACEBAR to speak.');
console.log('States: Idle (blue) → Listening (green) → Thinking (purple) → Speaking (orange) → Idle');
