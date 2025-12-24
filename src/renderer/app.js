// Renderer Process JavaScript
// This runs in the browser environment (like a normal website)

console.log('Aloy voice agent initialized!');

// Get references to DOM elements
const container = document.getElementById('container');
const stateTag = document.getElementById('state-tag');

// Define all possible states
const states = ['idle', 'listening', 'thinking', 'speaking'];
let currentStateIndex = 0;

// Function to change state
function setState(newState) {
  console.log('Changing state to:', newState);

  // Update the container's data-state attribute
  // This changes the --current-color CSS variable for both orb and tag
  container.dataset.state = newState;

  // Update the text in the state tag
  stateTag.textContent = newState;
}

// TEMPORARY: Press any key to cycle through states (for testing)
// We'll replace this with spacebar-specific logic later
document.addEventListener('keydown', (event) => {
  // Move to next state
  currentStateIndex = (currentStateIndex + 1) % states.length;
  setState(states[currentStateIndex]);
});

console.log('Press any key to cycle through states (testing mode)');
