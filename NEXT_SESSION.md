# Next Session: Iteration 6 - Interruption + Latency

## Quick Context

**Current state:** Iterations 1-5 complete
- ✅ Full voice conversation working (text + voice input/output)
- ✅ Memory system with conversation summaries
- ✅ Sentence-level TTS streaming with order preservation
- ✅ Hybrid mode (text and voice work simultaneously)

**What we're building next:**
1. **Interruption capability** - Press spacebar while Aloy speaks to interrupt
2. **Latency optimization** - Reduce response time from ~5s to <3s

---

## Implementation Plan

### Part 1: Interruption (Option A - Discard & Fresh) ⭐

**Decision made:** When user interrupts, discard old response and generate fresh one.
- No queue management
- No resume logic
- Clean slate for each interruption

**Files to modify:**
- `src/renderer/app.js`

**Changes needed:**

#### 1. Create `stopAloyCompletely()` function

Add after `stopRecording()` function (~line 485):

```javascript
/**
 * Stop Aloy's speech completely (for interruptions)
 */
function stopAloyCompletely() {
  // Stop current audio playback
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Clear all TTS queues
  sentenceQueue = [];
  audioBuffers.clear();
  nextOrderIndex = 0;
  nextPlayIndex = 0;
  isPlayingAudio = false;
  activeTTSCount = 0;
}
```

#### 2. Modify spacebar keydown handler

Find the keydown handler (~line 500) and update:

```javascript
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

  // NEW: Allow interruption during speaking
  if (currentState === 'speaking') {
    stopAloyCompletely();
    isSpacebarPressed = true;
    setState('listening');
    startRecording();
    return;
  }

  // NEW: Allow interruption during thinking (optional - can change mind)
  if (currentState === 'thinking') {
    // Could add stopRecording() here if already recording
    isSpacebarPressed = true;
    setState('listening');
    startRecording();
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
```

**Testing:**
1. Start conversation
2. While Aloy is speaking, press spacebar
3. Verify:
   - Audio stops immediately
   - Orb turns green
   - Can speak new question
   - Aloy responds to NEW question only

---

### Part 2: Latency Optimization

**Current timing breakdown:**
```
User speaks:          3.0s
Release spacebar:     0.0s
stopRecording wait:   0.5s  ← Can optimize
Deepgram finalize:    0.2s
Claude first token:   0.8s
TTS generation:       0.8s
Audio starts:         0.0s
----------------------------
TOTAL:                5.3s
```

**Target: <3s**

#### Optimization 1: Reduce stopRecording() wait

**File:** `src/renderer/app.js` - `stopRecording()` function (~line 462)

**Change:**
```javascript
// OLD
await new Promise(resolve => setTimeout(resolve, 500));

// NEW
await new Promise(resolve => setTimeout(resolve, 200));
```

**Expected improvement:** -300ms

#### Optimization 2: Parallel Claude + Deepgram finalization

**Current:** Wait for Deepgram → Start Claude
**New:** Start Claude immediately, Deepgram catches up

**File:** `src/renderer/app.js` - keyup handler (~line 530)

**Change:**
```javascript
// OLD
const transcript = await stopRecording();
if (transcript && transcript.trim()) {
  await sendMessageToAloy(transcript);
}

// NEW
// Start stopping recording (don't await yet)
const transcriptPromise = stopRecording();

// Small delay to ensure we have SOME transcript
await new Promise(resolve => setTimeout(resolve, 100));

// Get current transcript (even if not final)
const transcript = currentTranscript;

if (transcript && transcript.trim()) {
  // Start Claude immediately (parallel)
  sendMessageToAloy(transcript);

  // Finalize recording in background
  transcriptPromise.then(() => {
    console.log('Recording finalized');
  });
} else {
  // Wait for final if nothing yet
  const finalTranscript = await transcriptPromise;
  if (finalTranscript && finalTranscript.trim()) {
    await sendMessageToAloy(finalTranscript);
  } else {
    addMessage('No speech detected. Try again.', 'system');
    setState('idle');
  }
}
```

**Expected improvement:** ~200ms (Claude starts earlier)

**Total expected improvement:** ~500ms (from 5.3s → 4.8s)

#### Optimization 3: Profile and measure

Add timing logs to measure actual improvement:

```javascript
// At start of keyup handler
const interruptionStart = Date.now();

// When audio starts playing (in playAudio())
console.log(`Response latency: ${Date.now() - interruptionStart}ms`);
```

---

## Edge Cases to Test

1. **Rapid interruptions:**
   - Interrupt → speak → interrupt again
   - Should: Last interruption wins, clean state

2. **Interrupt during thinking:**
   - Ask question → immediately interrupt
   - Should: Stop processing, start new recording

3. **Interrupt at first sentence:**
   - Aloy just started speaking
   - Should: Same behavior, stop immediately

4. **No transcript after interrupt:**
   - Interrupt → don't speak → release
   - Should: "No speech detected" message

5. **Network latency:**
   - Slow Deepgram response
   - Should: Still handle interruption cleanly

---

## Success Criteria

**Interruption:**
- [ ] Can interrupt Aloy mid-sentence
- [ ] Audio stops within 100ms
- [ ] Orb changes to green immediately
- [ ] New question gets fresh response
- [ ] Old response fully discarded
- [ ] No state confusion or queue issues

**Latency:**
- [ ] Response time <4s (initial goal)
- [ ] Response time <3s (stretch goal)
- [ ] No choppy audio or timing issues
- [ ] Natural conversation flow

---

## Files Overview

**To modify:**
- `src/renderer/app.js` - Add stopAloyCompletely(), modify keydown/keyup handlers

**No changes needed:**
- `src/services/deepgram.js`
- `src/services/elevenlabs.js`
- `src/services/claude.js`
- `src/services/memory.js`

---

## Estimated Time

- Interruption implementation: 15-20 min
- Testing interruption: 5-10 min
- Latency optimization: 10-15 min
- Testing and profiling: 10-15 min

**Total: 40-60 minutes**

---

## After This Session

**If time permits:**
- Visual feedback improvements (waveform, progress indicators)
- Better error handling
- Polish animations

**Future iterations:**
- Voice Activity Detection (hands-free mode)
- Waveform visualizations
- Conversation export/replay
- Multi-turn context improvements

---

## Quick Start Commands

```bash
# Start app
npm start

# Test voice conversation
# 1. Click outside text input
# 2. Hold spacebar and speak
# 3. Release spacebar
# 4. While Aloy speaks, press spacebar again (NEW!)
```

---

## Discussion Notes from Previous Session

**Why Option A (Discard & Fresh)?**
- Simpler to implement
- More natural conversation flow
- Mirrors human behavior (interruption = change direction)
- No confusing queue management
- User interrupts BECAUSE they want something different

**Alternative options NOT chosen:**
- Option B: Queue & Resume - Too complex, awkward UX
- Option C: Smart Context Switch - Requires AI, adds latency

**Design philosophy:**
Interruption is a conversation redirect, not a pause/resume.
