# Aloy Voice Agent Prototype

A voice AI advisor for the GreatInventions project, featuring Aloy from Horizon as your brainstorming partner.

## Current Status: Iteration 2 Complete ✅

**What Works:**
- Beautiful animated spirit orb UI with 4 color states
- Text-based chat with Claude (Sonnet 4.5)
- Aloy personality: efficient, stoic, direct (like the game character)
- Conversation history maintained
- Full GreatInventions context loaded

**What's Next:**
- Iteration 3: Memory system (conversation summaries)
- Iteration 4: Voice output (TTS with ElevenLabs)
- Iteration 5: Voice input (STT with Deepgram)

## Quick Start

### Prerequisites
- Node.js installed
- Claude API key from https://console.anthropic.com/

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add your API key:**
   - Open `.env` file
   - Replace placeholder with your actual Claude API key

3. **Run the app:**
   ```bash
   npm start
   ```

## How to Use

### Chat with Aloy

1. Type a message in the chat panel
2. Press Enter or click Send
3. Watch the orb change colors as Aloy thinks and responds

### Orb States

- 🔵 **Blue (Idle)** - Ready for input
- 🟢 **Green (Listening)** - Press spacebar (for testing)
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
│   │   └── app.js           # Chat logic
│   └── services/
│       └── claude.js        # Claude API integration
├── .env                     # API keys (DO NOT COMMIT!)
├── claude.md               # Full documentation
└── ROADMAP.md              # Implementation plan
```

## Documentation

- **`claude.md`** - Complete project documentation and progress log
- **`ROADMAP.md`** - 7-iteration build plan with detailed tasks

## Tips

**Testing Aloy:** Try asking:
- "What should my next topic be?"
- "How should I market GreatInventions?"
- "Tell me about [inventor/invention]"

**Budget:** ~$3 per million tokens, typical conversation ~$0.0015

---

Built with: Electron, Claude API, HTML/CSS/JavaScript
