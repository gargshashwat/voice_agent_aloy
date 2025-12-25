# Aloy Voice Agent Prototype

A voice AI advisor for the GreatInventions project, featuring Aloy from Horizon as your brainstorming partner.

## Current Status: Iteration 5 Complete ✅

**What Works:**
- 🎨 Beautiful animated spirit orb UI with 4 color states
- 💬 Text-based chat with Claude (Sonnet 4.5)
- ⚡ Streaming responses (text appears word-by-word)
- 🎭 Aloy personality: efficient, stoic, direct (like the game character)
- 🧠 Memory system: Conversations saved across sessions
- 🔊 **Voice output (TTS)**: Aloy speaks with ElevenLabs
- 🎤 **Voice input (STT)**: Spacebar push-to-talk with Deepgram
- 🔄 **Hybrid mode**: Both text and voice input work simultaneously

**Voice Features:**
- Real-time transcription (see words as you speak)
- Sentence-level TTS streaming (low latency)
- Order-preserving parallel audio generation
- Works with built-in mic (Bluetooth compatibility issues with AirPods)

## Quick Start

### Prerequisites
- Node.js installed
- Claude API key from https://console.anthropic.com/
- ElevenLabs API key from https://elevenlabs.io/
- Deepgram API key from https://console.deepgram.com/

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add your API keys to `.env`:**
   ```
   CLAUDE_API_KEY=your_claude_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_key_here
   DEEPGRAM_API_KEY=your_deepgram_key_here
   ```

3. **Run the app:**
   ```bash
   npm start
   ```

4. **Important:** Use built-in microphone (not Bluetooth headphones like AirPods)

## How to Use

### Chat with Aloy (Two Ways)

**Text Mode:**
1. Type a message in the chat panel
2. Press Enter or click Send
3. Watch the orb change colors and hear Aloy respond

**Voice Mode:**
1. Click outside the text input
2. Hold spacebar to talk
3. See your words appear in real-time
4. Release spacebar when done
5. Aloy processes and responds with voice + text

### Orb States

- 🔵 **Blue (Idle)** - Ready for input
- 🟢 **Green (Listening)** - Recording your voice
- 🟣 **Purple (Thinking)** - Processing your message
- 🟠 **Orange (Speaking)** - Aloy is responding

### Topics to Discuss

- Next article ideas
- Marketing strategies
- Historical inventor parallels to modern startups
- Technical story angles

## Project Structure

```
voice-agent-prototype/
├── src/
│   ├── main.js              # Electron main process
│   ├── renderer/
│   │   ├── index.html       # UI layout
│   │   ├── style.css        # Styling and animations
│   │   └── app.js           # App logic (voice + text)
│   └── services/
│       ├── claude.js        # Claude API (streaming)
│       ├── memory.js        # Conversation summaries
│       ├── elevenlabs.js    # Text-to-speech
│       └── deepgram.js      # Speech-to-text
├── conversations/
│   └── memory.json          # Conversation history
├── .env                     # API keys (DO NOT COMMIT!)
├── CLAUDE.md               # Full documentation
└── README.md               # This file
```

## Documentation

- **`claude.md`** - Complete project documentation and progress log
- **`ROADMAP.md`** - 7-iteration build plan with detailed tasks

## Tips

**Testing Aloy:** Try asking:
- "What should my next topic be?"
- "How should I market GreatInventions?"
- "Tell me about [inventor/invention]"

**Budget per conversation:**
- Claude API: ~$0.002
- ElevenLabs TTS: ~$0.01
- Deepgram STT: ~$0.001
- **Total: ~$0.013 per voice conversation**

## Troubleshooting

**No audio output:**
- Check system volume
- Verify ElevenLabs API key in `.env`

**No speech detected:**
- Use built-in mic (not Bluetooth)
- Check microphone permissions
- Speak clearly and hold spacebar 2-3 seconds

**App won't start:**
- Run `npm install` again
- Check all three API keys are in `.env`

---

Built with: Electron, Claude API, ElevenLabs, Deepgram, HTML/CSS/JavaScript
