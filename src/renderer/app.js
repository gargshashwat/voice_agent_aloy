// Renderer Process JavaScript
// Now with Claude integration + Streaming!

const { sendMessageStreaming } = require('../services/claude');
const { generateSummary, saveMemory, saveRawConversation, processRawConversations, clearMemories } = require('../services/memory');
const { textToSpeechBuffer } = require('../services/elevenlabs');
const { startLiveTranscription } = require('../services/deepgram');

console.log('Aloy voice agent initialized');

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

// Track current audio playback
let currentAudio = null;

// Sentence queue for TTS generation
let sentenceQueue = [];
let activeTTSCount = 0;
const MAX_CONCURRENT_TTS = 2;  // ElevenLabs rate limit

// Audio buffers with order tracking
let audioBuffers = new Map();  // Map<orderIndex, audioBuffer>
let nextOrderIndex = 0;        // Next sentence to queue for TTS
let nextPlayIndex = 0;         // Next audio to play
let isPlayingAudio = false;

// Voice input (STT)
let mediaStream = null;
let audioContext = null;
let mediaStreamSource = null;
let audioProcessor = null;
let deepgramConnection = null;
let currentTranscript = '';
let isRecording = false;

/**
 * Play audio from buffer
 * @param {Buffer} audioBuffer - Audio data as buffer
 * @returns {Promise} - Resolves when audio finishes playing
 */
function playAudio(audioBuffer) {
  return new Promise((resolve, reject) => {
    // Convert buffer to blob
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(blob);

    // Create audio element
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    // When audio finishes
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      resolve();
    });

    // Handle errors
    audio.addEventListener('error', (error) => {
      console.error('Audio playback error:', error);
      currentAudio = null;
      reject(error);
    });

    // Play audio
    audio.play();
  });
}

/**
 * Extract complete sentences from text
 * @param {string} text - Text to parse
 * @returns {Array} - Array of complete sentences
 */
function extractSentences(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Queue a sentence for TTS generation with order tracking
 */
function queueSentence(text) {
  const orderIndex = nextOrderIndex++;
  sentenceQueue.push({ text, orderIndex });
  processSentences();
}

/**
 * Process TTS queue with concurrency limit
 */
async function processSentences() {
  // Process up to MAX_CONCURRENT_TTS sentences in parallel
  while (sentenceQueue.length > 0 && activeTTSCount < MAX_CONCURRENT_TTS) {
    const { text, orderIndex } = sentenceQueue.shift();
    activeTTSCount++;

    // Generate TTS (non-blocking)
    textToSpeechBuffer(text)
      .then(audioBuffer => {
        // Store audio with its order index
        audioBuffers.set(orderIndex, audioBuffer);
        activeTTSCount--;
        processSentences();  // Process next if available
        tryPlayNextAudio();  // Check if we can play next audio
      })
      .catch(error => {
        console.error('Error generating TTS:', error);
        activeTTSCount--;
        processSentences();
        tryPlayNextAudio();
      });
  }
}

/**
 * Try to play next audio if it's ready and in order
 */
function tryPlayNextAudio() {
  if (isPlayingAudio) return;

  // Check if next audio in sequence is ready
  if (audioBuffers.has(nextPlayIndex)) {
    playNextAudioInOrder();
  }
}

/**
 * Play audio buffers in correct order
 */
async function playNextAudioInOrder() {
  if (isPlayingAudio) return;

  isPlayingAudio = true;

  // Play all consecutive ready buffers
  while (audioBuffers.has(nextPlayIndex)) {
    const audioBuffer = audioBuffers.get(nextPlayIndex);
    audioBuffers.delete(nextPlayIndex);
    nextPlayIndex++;

    try {
      await playAudio(audioBuffer);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  isPlayingAudio = false;

  // Return to idle if everything is done
  if (sentenceQueue.length === 0 && activeTTSCount === 0 && audioBuffers.size === 0) {
    setState('idle');
  }
}

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

  // State transitions are now handled by audio playback
  // Orb stays in 'speaking' state while audio plays
  // Returns to 'idle' when audio finishes (handled in playAudio)
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
    let sentencesProcessed = [];

    // Send to Claude with streaming
    await sendMessageStreaming(
      userMessage,
      conversationHistory,
      async (token) => {
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

        // Check for complete sentences and generate audio
        const sentences = extractSentences(fullResponse);
        const newSentences = sentences.slice(sentencesProcessed.length);

        // Process new complete sentences
        for (const sentence of newSentences) {
          sentencesProcessed.push(sentence);
          queueSentence(sentence);
        }
      }
    );

    // Process any remaining partial sentence
    const finalSentences = extractSentences(fullResponse);
    if (fullResponse && finalSentences.length === sentencesProcessed.length) {
      // There's text left that doesn't end with punctuation
      const lastProcessedText = sentencesProcessed.join('');
      const remainingText = fullResponse.substring(lastProcessedText.length).trim();

      if (remainingText) {
        queueSentence(remainingText);
      }
    }

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
 * Start recording audio from microphone
 */
async function startRecording() {
  try {
    // Get microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    // Create audio context with device's native sample rate
    audioContext = new AudioContext();
    await audioContext.resume();

    mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);
    audioProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    // Start Deepgram connection
    currentTranscript = '';
    isRecording = true;
    deepgramConnection = startLiveTranscription((transcript, isFinal) => {
      currentTranscript = transcript;

      // Show interim transcript in input field
      if (!isFinal) {
        messageInput.value = transcript;
      }
    });

    // Send audio data to Deepgram
    audioProcessor.onaudioprocess = (e) => {
      if (!isRecording || !deepgramConnection) return;

      const inputData = e.inputBuffer.getChannelData(0);

      // Convert Float32Array to Int16Array (Deepgram expects PCM16)
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Send to Deepgram
      if (deepgramConnection.getReadyState() === 1) {
        deepgramConnection.send(pcm16.buffer);
      }
    };

    // Connect audio nodes
    mediaStreamSource.connect(audioProcessor);
    audioProcessor.connect(audioContext.destination);
  } catch (error) {
    console.error('Error starting recording:', error);
    addMessage('Microphone access denied. Please allow microphone access and try again.', 'system');
    setState('idle');
  }
}

/**
 * Stop recording and get final transcript
 */
async function stopRecording() {
  // Stop sending audio immediately
  isRecording = false;

  // Small delay to let final audio chunks process
  await new Promise(resolve => setTimeout(resolve, 100));

  // Disconnect audio processor
  if (audioProcessor) {
    audioProcessor.disconnect();
    audioProcessor.onaudioprocess = null;
    audioProcessor = null;
  }

  // Disconnect media stream source
  if (mediaStreamSource) {
    mediaStreamSource.disconnect();
    mediaStreamSource = null;
  }

  // Close Deepgram connection
  if (deepgramConnection) {
    deepgramConnection.finish();

    // Wait a bit for final transcript
    await new Promise(resolve => setTimeout(resolve, 500));

    deepgramConnection = null;
  }

  // Stop microphone
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }

  // Close audio context
  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }

  // Return final transcript
  return currentTranscript;
}

/**
 * Spacebar for voice input (press to talk)
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
  startRecording();
});

document.addEventListener('keyup', async (event) => {
  if (event.code !== 'Space') {
    return;
  }

  isSpacebarPressed = false;

  if (currentState === 'listening') {
    setState('thinking');

    // Stop recording and get transcript
    const transcript = await stopRecording();

    if (transcript && transcript.trim()) {
      // Send to Claude
      await sendMessageToAloy(transcript);
    } else {
      addMessage('No speech detected. Try again.', 'system');
      setState('idle');
    }
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

console.log('Ready! Type a message OR hold spacebar to talk.');
console.log('Text: Type and press Enter | Voice: Hold spacebar and speak');
