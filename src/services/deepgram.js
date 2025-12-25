// Deepgram STT Service - Speech-to-Text
require('dotenv').config();
const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

/**
 * Start live transcription session
 * @param {Function} onTranscript - Callback for interim transcripts: (text, isFinal) => {}
 * @returns {Object} - Connection object with send() and finish() methods
 */
function startLiveTranscription(onTranscript) {
  const connection = deepgram.listen.live({
    model: 'nova-2',
    language: 'en-US',
    encoding: 'linear16',
    sample_rate: 48000,
    channels: 1,
    smart_format: true,
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,
  });

  // Handle transcription results
  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel.alternatives[0].transcript;
    const isFinal = data.is_final;

    if (transcript && transcript.trim()) {
      onTranscript(transcript, isFinal);
    }
  });

  // Handle errors
  connection.on(LiveTranscriptionEvents.Error, (error) => {
    console.error('Deepgram error:', error);
  });

  return connection;
}

module.exports = {
  startLiveTranscription,
};
