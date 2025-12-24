# Voice AI Agent Prototype - Learning Project

## Primary Goal
**Learn to build prototypes quickly** by building a voice AI advisor for the GreatInventions project.

This is a LEARNING PROJECT - the focus is on understanding architecture, making rapid decisions, and building end-to-end systems, not just shipping a product.

## Project Context

### GreatInventions Background
- Media project about engineering inventions, inventors, and product design
- Target audience: CEOs, deep tech founders, VCs, researchers
- Format: Newsletter → Podcast → Media empire
- **Context files:**
  - `/Users/sash/Documents/GreatInventions/PROJECT_GOALS.md`
  - `/Users/sash/Documents/GreatInventions/GreatInventions.md`
- **Published articles:**
  - WiFi (Hedy Lamarr's frequency hopping + CSIRO's OFDM)
  - Shipping Container (Malcolm McLean and globalization)
  - QR Code
- **Writing style:** Long-form, deeply researched, inventor-focused stories with technical depth and modern founder lessons

### Voice Agent Purpose
A conversational AI advisor that helps with:
- Choosing next topics to write about
- Marketing strategies
- Brainstorming ideas for the project
- General project advice

## Agent Specifications

### Personality - "Aloy"
- **Name:** Aloy (inspired by Horizon Zero Dawn character)
- **Role:** Brainstorming partner
- **Tone:** Energetic, conversational, fast-paced, strong and curious
- **Response style:** Brief (2-3 sentences max), asks 1-2 clarifying questions max, offers crisp actionable suggestions
- **Language:** Uses "we" language, occasionally challenges assumptions, proactively suggests ideas
- **Voice:** Female voice matching Aloy's character - strong, determined, curious (ElevenLabs)

### Technical Requirements
- Real-time back-and-forth conversation
- Low latency (feels like talking to a real person)
- Spacebar push-to-talk interaction
- Visual UI showing agent state with automatic transitions
- Full GreatInventions context (PROJECT_GOALS, published articles, writing style)
- Conversation memory across sessions (summary-based)

## Architecture

### High-Level Flow
```
User Voice → STT → Claude API → TTS → Audio Output
              ↓                    ↓
         Transcript          Audio Chunks
              ↓                    ↓
         Conversation         UI Feedback
           History          (listening/speaking)
```

### Component Stack

**1. Speech-to-Text (STT)**
- **Choice:** Deepgram (~$0.0043/min)
- Why: Fast, cheap, good quality, supports streaming
- Alternative: OpenAI Whisper for higher accuracy

**2. Conversation Engine**
- **Choice:** Claude API (Sonnet 4.5)
- Streaming enabled for low latency
- System prompt: Defines advisor persona + GreatInventions context
- Conversation history: Last 10-15 exchanges

**3. Text-to-Speech (TTS)**
- **Choice:** ElevenLabs (~$0.30/1K chars)
- Female voice (user-selected)
- Streaming enabled

**4. Desktop Application**
- **Choice:** Electron + Node.js
- Frontend: Simple HTML/CSS/JS or React
- Backend: WebSocket server orchestrating all services

### Latency Optimization Strategy

**Goal:** <2 second response time from user finishing speech to agent starting to speak

**Techniques:**
1. **Streaming everywhere:**
   - Deepgram: Real-time transcription via WebSocket
   - Claude: Stream tokens as generated
   - ElevenLabs: Stream audio chunks

2. **Sentence-level chunking:**
   - Don't wait for full Claude response
   - Send each complete sentence to TTS immediately
   - Play audio as soon as first chunk arrives

3. **Voice Activity Detection (VAD):**
   - Detect when user stops speaking
   - Start processing immediately
   - Support interruptions (stop playback if user speaks)

4. **Parallel processing:**
   - While sentence N is being spoken, sentence N+1 is being generated

### UI Design

**Visual Reference:** J&J screenshots - Siri-like spirit orb design

**Interface:**
- **Spirit orb:** Central radial gradient sphere with soft blur
- **State tag:** Pill-shaped label below orb showing current state
- **Color-coded states (automatic transitions):**
  - **Blue:** Idle/waiting for input (gentle pulse)
  - **Green:** Listening (press spacebar, amplitude-reactive animation)
  - **Purple:** Thinking/processing (rotation/flow effect)
  - **Orange/Yellow:** Speaking (waveform synced to audio)

**Interaction Flow:**
1. Press spacebar → Green (Listening)
2. Release spacebar → Purple (Thinking)
3. Aloy starts speaking → Orange (Speaking)
4. Response complete → Blue (Idle)

**Optional for debugging:**
- Live transcript display
- Latency metrics

### Memory System

**Conversation Summaries:**
After each conversation, Claude generates a summary containing:
- Date and time
- Topics discussed
- Ideas generated
- Decisions made
- Action items/next steps
- User's interests and priorities

**Storage:**
- Simple JSON file: `conversations/memory.json`
- Human-readable and editable
- Lightweight (summaries, not full transcripts)

**Context Loading:**
- On app startup, load last 10 conversation summaries
- Include in system prompt as "Previous conversations context"
- Enables continuity across sessions
- Keeps token usage low while maintaining memory

**Benefits:**
- Cost-effective (summaries vs full transcripts)
- Debuggable (can read/edit JSON directly)
- Scalable (can add search/export features later)
- Natural conversations ("Remember last time we discussed...")

### Budget Constraints

**Target:** <$10 for all iteration/testing

**Estimated costs per hour of conversation:**
- STT (Deepgram): $0.26
- Claude API: $0.45
- ElevenLabs: $0.90
- **Total: ~$1.60/hour** → ~6 hours of testing with $10

## Tech Stack

**Application:**
- Electron (desktop app framework)
- Node.js (backend/orchestration)
- JavaScript/TypeScript (TBD based on learning preference)

**Frontend:**
- HTML/CSS for UI
- Web Audio API for mic input/speaker output
- Canvas or CSS animations for visualizations

**Backend Services:**
- Deepgram Node SDK
- Anthropic Claude SDK
- ElevenLabs Node SDK
- WebSocket for real-time communication

**Key Libraries:**
- `ws` - WebSocket server
- `@deepgram/sdk` - STT
- `@anthropic-ai/sdk` - Claude
- `elevenlabs-node` or API calls - TTS
- Audio processing libraries TBD

## Learning Objectives

Through this project, understand:

1. **Real-time audio processing:**
   - Capturing microphone input
   - Streaming audio to services
   - Playing back audio chunks

2. **API streaming patterns:**
   - How to stream from Claude API
   - Chunking strategies for low latency
   - Error handling in streaming contexts

3. **State management:**
   - Conversation state (listening → processing → speaking)
   - Conversation history management
   - Handling interruptions

4. **Electron/Desktop app basics:**
   - Setting up an Electron app
   - IPC between main/renderer processes
   - Packaging for distribution

5. **Prototype development skills:**
   - Making fast architectural decisions
   - Balancing quality vs speed
   - Iterating based on real usage

## Implementation Approach

### Phase 1: Foundation (Core Loop)
- Set up Electron app structure
- Implement basic STT → Claude → TTS pipeline
- Text-based testing (type instead of speak)
- Validate latency and response quality

### Phase 2: Audio Integration
- Add microphone input
- Integrate Deepgram streaming STT
- Integrate ElevenLabs streaming TTS
- Test end-to-end voice loop

### Phase 3: Optimization
- Implement sentence-level chunking
- Add VAD for better turn-taking
- Optimize buffering and streaming
- Measure and improve latency

### Phase 4: UI Polish
- Create visual feedback (listening/speaking indicators)
- Add conversation transcript display
- Smooth animations
- Error state handling

### Phase 5: Refinement
- Tune agent personality via system prompt
- Improve conversation context management
- Add features (pause, reset conversation, etc.)
- User testing and iteration

## Project Structure

```
voice-agent-prototype/
├── claude.md                 # This file
├── README.md                 # Setup instructions
├── package.json              # Dependencies
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Electron preload script
│   ├── renderer/
│   │   ├── index.html       # UI
│   │   ├── style.css        # Styling
│   │   └── app.js           # Frontend logic
│   ├── services/
│   │   ├── deepgram.js      # STT integration
│   │   ├── claude.js        # Conversation engine
│   │   ├── elevenlabs.js    # TTS integration
│   │   └── orchestrator.js  # Coordinates all services
│   └── utils/
│       ├── audio.js         # Audio processing utilities
│       └── config.js        # API keys, settings
└── assets/
    └── context/
        └── project-goals.md # GreatInventions context
```

## Success Criteria

**Technical:**
- Consistent <2 second response latency
- Natural conversation flow with interruption support
- Stable audio quality
- No crashes during 10+ minute conversations

**Learning:**
- Understand each component well enough to modify
- Can explain architecture decisions
- Can extend/adapt for other use cases
- Comfortable with rapid prototyping workflow

**User Experience:**
- Feels like talking to a real brainstorming partner
- Agent responses are helpful for GreatInventions project
- UI clearly communicates agent state
- Overall experience feels "natural"

## Next Steps

1. Set up project structure
2. Install dependencies and configure API keys
3. Build minimal text-based conversation loop (STT/TTS mocked)
4. Add Claude integration with GreatInventions context
5. Integrate real voice services
6. Optimize latency
7. Polish UI
8. Test and iterate

## Notes & Decisions Log

_Document key decisions and learnings as we build..._

### Initial Planning - 2025-12-24

**Decision: Agent name "Aloy"**
- Inspired by Horizon Zero Dawn character
- Voice should match: strong, determined, curious
- Need to find matching ElevenLabs voice

**Decision: J&J screenshot visual design**
- Siri-like spirit orb with radial gradient
- Color-coded states: Blue (idle), Green (listening), Purple (thinking), Orange (speaking)
- Automatic state transitions based on agent state
- Pill-shaped tag showing current state

**Decision: Spacebar push-to-talk**
- Press spacebar to start listening
- Release to trigger processing
- States flow automatically from there
- Simpler and more reliable than VAD for v1

**Decision: Summary-based memory system**
- Store conversation summaries, not full transcripts
- JSON file for simplicity and debuggability
- Load last 10 summaries on startup
- Cost-effective while maintaining continuity

**Decision: Full GreatInventions context**
- Load PROJECT_GOALS and published articles
- Aloy should deeply know the project
- Include writing style and target audience

**Decision: Using Deepgram over alternatives**
- Rationale: Best balance of cost, speed, and accuracy for prototyping

**Decision: Electron over Tauri**
- Rationale: More mature ecosystem, easier to find examples (can revisit Tauri later for production)

**Decision: Sentence-level chunking for latency optimization**
- Rationale: Meaningful units that can be sent to TTS immediately without waiting for full response

**Decision: 7-iteration roadmap**
- Start with static UI to nail the visual design
- Add Claude text conversation before voice
- Build memory system early for better testing
- Add voice output, then input
- Optimize latency as separate phase
- Polish at the end
