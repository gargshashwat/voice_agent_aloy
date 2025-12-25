# Aloy Voice Agent - Build Roadmap

## Project Overview

Building a voice AI advisor named **Aloy** (from Horizon Zero Dawn) to help brainstorm ideas, choose topics, and strategize for the GreatInventions media project.

**Primary Goal:** Learn to build prototypes quickly through hands-on development.

## Agent Specifications

### Personality - "Aloy"
- **Role:** Brainstorming partner for GreatInventions
- **Tone:** Energetic, conversational, fast-paced
- **Response style:** Brief (2-3 sentences max), asks follow-up questions (max 1-2), offers crisp actionable suggestions
- **Voice:** Female voice matching Aloy's character (strong, curious, determined)
- **Knowledge base:** Full GreatInventions context

### Interaction Model
- **Input:** Press and hold spacebar to speak
- **State flow:** Automatic transitions based on agent state
  - User presses space → **Green** (Listening)
  - User releases space → **Purple** (Thinking)
  - Agent starts speaking → **Orange** (Speaking)
  - Agent finishes → **Blue** (Idle)

### Visual Design
Inspired by J&J screenshots - Siri-like spirit orb interface:
- **Spirit orb:** Radial gradient, soft blur, animated
- **State indicator:** Pill-shaped tag below showing current state
- **Color-coded states:**
  - Blue: Idle/waiting
  - Green: Listening
  - Purple: Thinking/processing
  - Orange/yellow: Speaking

### Memory System
- After each conversation, Aloy generates a summary
- Saves to `conversations/memory.json` with:
  - Date/time
  - Topics discussed
  - Ideas generated
  - Decisions made
  - Action items
  - User's interests/priorities
- On startup, loads last 10 conversation summaries
- Provides continuity across sessions

### Context Sources
Aloy has full knowledge of GreatInventions:
- `/Users/sash/Documents/GreatInventions/PROJECT_GOALS.md`
- `/Users/sash/Documents/GreatInventions/GreatInventions.md`
- Published articles:
  - WiFi (Hedy Lamarr + CSIRO)
  - Shipping Container (Malcolm McLean)
  - QR Code
- Writing style, target audience, growth strategy

## Technical Architecture

### Stack
- **Desktop App:** Electron + Node.js
- **Frontend:** HTML/CSS/JavaScript (vanilla or React TBD)
- **STT:** Deepgram (~$0.0043/min)
- **LLM:** Claude API (Sonnet 4.5) with streaming
- **TTS:** ElevenLabs (~$0.30/1K chars) with streaming
- **Audio:** Web Audio API

### Latency Target
<2 seconds from user finishing speech to Aloy starting to speak

### Optimization Strategy
1. Stream everywhere (Deepgram, Claude, ElevenLabs)
2. Sentence-level chunking (send to TTS immediately)
3. Parallel processing (generate next sentence while speaking current)
4. Efficient audio buffering

### Budget Constraint
<$10 total for all testing/iteration (~6 hours of conversation time)

## Feature Roadmap

### Iteration 1: Static UI + State Management ✅ COMPLETE
**Goal:** Visual design working perfectly, state transitions smooth and automatic

**Tasks:**
- Set up Electron app boilerplate
- Build spirit orb visual (CSS/Canvas radial gradient)
- Implement 4 color states (blue/green/purple/orange)
- Create pill-shaped state tag
- Add smooth color transitions
- Implement spacebar detection
- Wire up automatic state flow:
  - Spacebar press → Green
  - Spacebar release → Purple
  - Simulate "agent speaking" → Orange
  - Return to Blue after timeout
- Add animations (pulse for listening, rotation for thinking, waveform for speaking)

**Success Criteria:**
- Press spacebar → see green (listening)
- Release → purple (thinking)
- Automatic transition → orange (speaking)
- Smooth animations throughout
- Returns to blue idle state

**What You'll Learn:**
- Electron app structure
- CSS animations and gradients
- Keyboard event handling
- State management in UI

---

### Iteration 2: Text-Based Conversation Loop ✅ COMPLETE
**Goal:** Claude integration working with GreatInventions context (no voice yet)

**Tasks:**
- Set up Claude API integration
- Create system prompt for Aloy persona
- Load GreatInventions context files
- Build text input interface (type instead of speak)
- Display conversation in UI
- Wire typing to state changes (thinking → speaking)
- Test response quality and persona
- Iterate on system prompt until responses feel right

**Success Criteria:**
- Type a question about GreatInventions
- Aloy responds with helpful, brief, on-brand suggestions
- Responses show knowledge of published articles
- Persona feels like brainstorming partner
- State transitions work correctly

**What You'll Learn:**
- Claude API basics
- Streaming API responses
- System prompt engineering
- Context window management

---

### Iteration 3: Memory System ✅ COMPLETE
**Goal:** Conversation summaries and continuity across sessions

**Tasks:**
- Create `conversations/` directory structure
- Implement conversation summary generation
  - After conversation ends, send full transcript to Claude
  - Extract: topics, ideas, decisions, next steps, user interests
  - Save to `memory.json` with timestamp
- On app startup, load last 10 summaries
- Include summaries in system prompt as context
- Test continuity (reference previous conversation topics)

**Success Criteria:**
- Have a conversation about "next article topic"
- Close and reopen app
- Start new conversation - Aloy references previous discussion
- Memory file is human-readable and accurate

**What You'll Learn:**
- File I/O in Node.js
- Conversation summarization techniques
- Context management strategies
- Balancing memory vs token costs

---

### Iteration 4: Voice Output (TTS) ✅ COMPLETE
**Goal:** Aloy speaks responses out loud

**Tasks:**
- Set up ElevenLabs API
- Select female voice matching Aloy's character
- Integrate TTS into conversation flow
- Stream audio chunks and play immediately
- Sync UI to speaking state (orange when audio playing)
- Handle audio playback errors gracefully
- Test voice quality and adjust settings

**Success Criteria:**
- Type a question
- Aloy responds with voice (not just text)
- Speaking state (orange) active during playback
- Audio quality is clear and natural
- Returns to idle when done speaking

**What You'll Learn:**
- ElevenLabs API integration
- Audio streaming and playback
- Web Audio API basics
- Synchronizing UI with audio state

---

### Iteration 5: Voice Input (STT) ✅ COMPLETE
**Goal:** Full voice conversation - speak to Aloy

**Tasks:**
- Set up Deepgram API
- Implement microphone access (Web Audio API)
- Capture audio while spacebar is held
- Stream audio to Deepgram for real-time transcription
- Display transcript (optional, for debugging)
- Send transcript to Claude when spacebar released
- Test accuracy with different speaking styles

**Success Criteria:**
- Press spacebar and speak
- See listening state (green)
- Release spacebar
- Aloy correctly transcribes and responds with voice
- Full voice conversation loop working end-to-end

**What You'll Learn:**
- Microphone input handling
- Deepgram streaming STT
- Audio buffer management
- Real-time transcription

---

### Iteration 6: Interruption + Latency Optimization 🔜 NEXT
**Goal:** Natural conversation flow with interruption capability and reduced latency

**Part 1: Interruption (Option A - Discard & Fresh)**
- Allow spacebar press during 'speaking' state to interrupt Aloy
- Stop audio playback immediately
- Clear all TTS queues (sentenceQueue, audioBuffers)
- Reset state indices (nextOrderIndex, nextPlayIndex)
- Start listening for new input
- Discard old response completely (no resume/queue)

**Part 2: Latency Optimization**
- Reduce stopRecording() wait: 500ms → 200ms
- Start Claude streaming immediately (parallel with Deepgram finalization)
- Profile current timing:
  - Speak (3s) → Wait (0.5s) → Claude (1s) → TTS (0.8s) → Play
  - Current total: ~5.3s
  - Target: <3s
- Optimize audio buffering
- Test with various conversation patterns

**Implementation Details:**
```javascript
// Modified keydown handler
if (currentState === 'speaking') {
  stopAloyCompletely();  // New function
  setState('listening');
  startRecording();
  return;
}

// New function
function stopAloyCompletely() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  sentenceQueue = [];
  audioBuffers.clear();
  nextOrderIndex = 0;
  nextPlayIndex = 0;
  isPlayingAudio = false;
  activeTTSCount = 0;
}
```

**Edge Cases:**
- Interrupting during thinking state (allow)
- Rapid successive interruptions (last one wins)
- Interrupting during first sentence (same behavior)

**Success Criteria:**
- Can interrupt Aloy mid-sentence
- Interruption is instant (<100ms)
- New question gets fresh response
- No queue confusion or state issues
- Total response time <3 seconds

**What You'll Learn:**
- Interruption handling patterns
- Clean state reset strategies
- Performance profiling
- Latency optimization techniques

---

### Iteration 7: Polish & Refinement
**Goal:** Production-quality user experience

**Tasks:**
- Fine-tune spirit orb animations
  - Listening: animate based on mic amplitude
  - Thinking: smooth rotation/flow effect
  - Speaking: sync to audio waveform
- Add error handling:
  - API failures (graceful fallback)
  - Network issues (retry logic)
  - Microphone permission denied
- Improve conversation context management
- Add optional transcript display
- Test extended conversations (10+ minutes)
- Add keyboard shortcuts:
  - ESC to cancel/reset
  - CMD+R to restart conversation
- Optimize memory summaries

**Success Criteria:**
- Have 10+ minute conversation without issues
- Animations feel alive and responsive
- Errors handled gracefully (no crashes)
- Overall experience feels polished and natural
- Memory system accurately tracks conversation history

**What You'll Learn:**
- Animation techniques (audio-reactive visuals)
- Error handling best practices
- UX polish and attention to detail
- Production-ready app development

---

## Success Metrics

### Technical
- [ ] Consistent <2 second response latency
- [ ] Natural conversation flow
- [ ] Stable audio quality
- [ ] No crashes during 10+ minute conversations
- [ ] Memory system maintains continuity across sessions

### Learning
- [ ] Understand each component well enough to modify independently
- [ ] Can explain architectural decisions and trade-offs
- [ ] Can extend/adapt system for other use cases
- [ ] Comfortable with rapid prototyping workflow

### User Experience
- [ ] Feels like talking to a real brainstorming partner
- [ ] Aloy's responses are helpful for GreatInventions
- [ ] UI clearly communicates agent state at all times
- [ ] Overall experience feels natural and engaging

## Out of Scope for V1

These are explicitly NOT included in initial build:
- Multiple conversation modes
- In-app voice customization
- Exporting conversation transcripts
- Integration with newsletter tools
- Multiple agent personalities
- Mobile app version
- ~~Voice interruption (cutting off Aloy mid-sentence)~~ ✅ Now in Iteration 6
- Conversation search/browse interface
- Voice Activity Detection (VAD) for automatic turn-taking
- Resume interrupted responses (using Option A: discard & fresh instead)

(Can be added in V2 after learning from V1)

## Notes & Learnings

### Voice Selection - Aloy
- Research ElevenLabs voices that match:
  - Strong, confident tone
  - Curious and engaged
  - Not overly formal or robotic
  - Energetic but focused
- Test 2-3 options before committing

### GreatInventions Context
Published articles to include:
1. **WiFi** - Hedy Lamarr (frequency hopping) + CSIRO (OFDM)
2. **Shipping Container** - Malcolm McLean and globalization
3. **QR Code** - (need to review)

Writing style:
- Long-form, deeply researched
- Inventor/entrepreneur focused
- Technical but accessible
- Modern parallels and founder lessons
- Emphasizes determination and total commitment

### Estimated Timeline
- Iteration 1 (UI): 2-3 hours
- Iteration 2 (Claude): 2-3 hours
- Iteration 3 (Memory): 1-2 hours
- Iteration 4 (TTS): 2-3 hours
- Iteration 5 (STT): 2-3 hours
- Iteration 6 (Optimization): 3-4 hours
- Iteration 7 (Polish): 2-3 hours

**Total: 14-21 hours** spread over multiple sessions

### Budget Tracking
- Target: <$10 total
- Track spending per iteration
- Estimated: ~$1.60/hour of conversation
- Should allow ~6 hours of testing

---

## Next Steps

1. Review and align on roadmap
2. Set up project structure
3. Install dependencies
4. Begin Iteration 1: Static UI + State Management
