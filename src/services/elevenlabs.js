// ElevenLabs TTS Service - Text-to-Speech
require('dotenv').config();
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');

// Initialize ElevenLabs client
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Voice ID for Aloy
const VOICE_ID = '09AoN6tYyW3VSTQqCo7C';

/**
 * Convert text to speech and return audio as buffer
 * @param {string} text - The text to convert to speech
 * @returns {Promise<Buffer>} - Audio buffer
 */
async function textToSpeechBuffer(text) {
  try {
    console.log('Converting text to speech:', text.substring(0, 50) + '...');

    const audioStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      text: text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    });

    // ReadableStream - use reader to get chunks
    const reader = audioStream.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = Buffer.concat(chunks);
    console.log(`Generated audio: ${audioBuffer.length} bytes`);

    return audioBuffer;
  } catch (error) {
    console.error('Error converting text to speech buffer:', error);
    throw error;
  }
}

module.exports = {
  textToSpeechBuffer,
};
