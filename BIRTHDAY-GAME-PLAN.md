# 🎯 OPERATION: LASER BIRTHDAY — Game Plan & Build Spec

## Executive Summary

An interactive, neon-drenched laser tag themed web game for 5–6 year olds that serves as the unlock mechanism for a birthday party invitation. Players complete a series of short, exciting mini-game challenges themed around a "secret laser agent mission." Upon completing all missions, they unlock an animated party invitation with all the event details.

The entire experience should feel like a AAA kids' game — fluid animations, pumping sound effects, particle explosions, and screen-shaking feedback. This is NOT a boring form. This is an EVENT.

---

## 🎨 Aesthetic Direction: NEON ARCADE OVERLOAD

### Visual Identity
- **Theme**: Retro-futuristic neon arcade meets laser tag arena
- **Palette**:
  - Primary background: Deep space black (`#0a0a1a`) with subtle animated star field
  - Neon green (`#39FF14`) — primary action color, laser beams
  - Electric cyan (`#00FFFF`) — secondary highlights, UI chrome
  - Hot magenta/pink (`#FF00FF`) — explosions, rewards, celebrations
  - Laser red (`#FF073A`) — enemy elements, danger zones
  - Electric purple (`#BF00FF`) — accent glows, portals
  - Warm gold (`#FFD700`) — stars, achievements, treasure
- **Glow Effects**: EVERYTHING glows. Text-shadow neon effects on all headings. Box-shadow pulses on interactive elements. CSS filter: drop-shadow on sprites/icons.
- **Background**: Animated dark grid floor (CSS perspective grid receding into distance like a TRON-style floor) with floating particle dust

### Typography
- **Display Font**: "Orbitron" (Google Fonts) — techy, bold, laser-tag feel
- **Body/UI Font**: "Exo 2" (Google Fonts) — readable but still sci-fi
- **Numbers/Score**: "Press Start 2P" (Google Fonts) — retro arcade counter feel
- All text should have neon glow text-shadow effects in the theme colors

### Audio Design (Web Audio API or HTML5 Audio with hosted .mp3/.wav)
- Background music: Synthwave/retro electronic loop (royalty-free, ~80-100bpm, upbeat but not overwhelming)
- SFX library needed:
  - Laser "pew pew" sounds (for shooting/clicking)
  - Explosion/boom (for destroying targets)
  - Power-up chime (ascending sparkle tone)
  - Achievement unlocked (triumphant brass hit + sparkle)
  - Error/miss buzzer (quick low tone)
  - Countdown beeps (3-2-1-GO!)
  - Victory fanfare (for completing each mission and final unlock)
  - UI click/hover sounds (subtle mechanical clicks)
- Audio should be optional (mute button) but ON by default
- Use free sound effect sources: freesound.org assets or generate with Web Audio API oscillators

### Animation Standards
- Use CSS animations for UI elements (pulse, glow, float, shake)
- Use requestAnimationFrame for game loops
- Canvas 2D for the shooting mini-game
- Particle systems for explosions, sparkles, laser trails
- Screen shake effect on impacts (CSS transform on game container)
- Staggered entrance animations on all screens (elements fly/fade in sequentially)
- Transitions between screens: wipe/portal effect (expanding circle reveal or horizontal wipe with scanline effect)

---

## 🏗️ Technical Architecture

### Stack
- **Framework**: Single-page React application (`.jsx` artifact)
- **Styling**: Tailwind CSS utility classes + inline CSS for custom animations/effects
- **Game Rendering**: HTML Canvas 2D API for the shooting game; DOM-based for other mini-games
- **Audio**: Web Audio API for generated SFX + HTML5 Audio for background music
- **State Management**: React useState/useReducer (all state in-memory, no localStorage)
- **Animations**: CSS @keyframes + requestAnimationFrame for game loops
- **Fonts**: Google Fonts loaded via @import in style tag
- **No external game libraries** — everything custom-built for maximum control

### Responsive Design
- Must work on phones (parents will share links via text/group chat)
- Touch-friendly: all tap targets minimum 48x48px
- Landscape AND portrait support (game adapts layout)
- Target: 360px minimum width up to 1920px desktop

### Performance
- Keep bundle in single file (React artifact)
- Lazy-render game canvases (only mount active game)
- Use CSS will-change and transform: translateZ(0) for smooth animations
- Debounce rapid inputs
- Target 60fps on game canvas

---

## 🎮 Game Flow & Screens

### Screen 1: TITLE SCREEN — "Operation: Laser Birthday"

**Layout:**
- Full-screen dark background with animated perspective grid floor
- Floating animated particles/stars
- Large title "OPERATION: LASER BIRTHDAY" in Orbitron with rainbow-cycling neon glow
- Subtitle: "TOP SECRET MISSION BRIEFING" flickering like a damaged screen
- A large pulsing "START MISSION" button (neon green border, glowing, hover/pulse animation)
- Small animated laser beams shooting across the screen randomly (CSS animated divs)
- Optional: Player name input field styled as a "AGENT CODENAME" terminal input with blinking cursor

**Behavior:**
- On load: staggered entrance animation (title drops in, subtitle fades, button pulses in)
- Background music starts on first user interaction (browser autoplay policy)
- Clicking "START MISSION" triggers a "powering up" animation (screen flash, zoom effect) then transitions to Mission Select

**Agent Name Input:**
- Styled like a retro terminal: green monospace text on black background, blinking underscore cursor
- Label: "ENTER AGENT CODENAME:"
- Used to personalize the final invitation ("Agent [NAME], you are invited...")
- If left blank, default to "Agent" or "Recruit"

---

### Screen 2: MISSION SELECT HQ — The Hub

**Layout:**
- A "command center" dashboard layout
- 3 mission cards arranged horizontally (or stacked on mobile)
- Each card shows:
  - Mission number (MISSION 01, MISSION 02, MISSION 03)
  - Mission codename (themed name)
  - A relevant icon/emoji (large, animated)
  - Status: LOCKED 🔒 / READY ▶️ / COMPLETE ✅
  - Difficulty stars (⭐ — all easy, just for fun/visual)
- Missions unlock sequentially (1 → 2 → 3)
- Below the missions: a "MISSION STATUS" progress bar showing 0/3, 1/3, 2/3, 3/3 with neon fill animation
- When all 3 complete: the progress bar explodes into particles and a "DECRYPT INVITATION" mega-button appears with over-the-top glow/pulse animation

**Mission Cards Detail:**
- **MISSION 01: "TARGET PRACTICE"** — 🎯 Laser Target Shooting Game
- **MISSION 02: "CODE CRACKER"** — 🔐 Pattern Memory Puzzle
- **MISSION 03: "LASER MAZE"** — ⚡ Maze Navigation Game

**Behavior:**
- Completed missions show a holographic checkmark overlay with sparkle animation
- Locked missions have a static/glitch effect overlay and are not clickable
- Hovering over a ready mission makes it glow brighter and slightly scale up
- Clicking a mission triggers a "deploying agent" animation (zoom into the card) then loads the game

---

### Screen 3: MISSION 01 — "Target Practice" (Shooting Gallery)

**Concept:** A classic shooting gallery where targets pop up and the player must tap/click them before they disappear. Laser tag themed — targets are glowing bullseyes or enemy "bots."

**Implementation: Canvas 2D Game**

**Game Mechanics:**
- Game duration: 30 seconds (countdown timer displayed prominently)
- Targets appear at random positions on the canvas
- Each target is visible for 2.0–3.0 seconds (randomized) before disappearing
- 1–2 targets visible at a time (easy for 6-year-olds)
- Targets: glowing circles with concentric rings (like a bullseye) in neon red/orange, pulsing
- Hit target: explodes into neon particles + score +1 + "pew!" sound
- Miss (click empty space): brief red flash + miss sound (but NO penalty — keep it fun!)
- Win condition: Hit 8 or more targets (out of ~15-18 that appear). Very achievable.
- Fail: fewer than 8 hits — encouraging "TRY AGAIN, AGENT!" message with instant retry button
- Score display: Large arcade-style number in top-right with "Press Start 2P" font

**Visual Details:**
- Canvas background: dark arena with subtle grid lines
- When a target is hit: radial particle burst (8-12 particles flying outward in target's color, fading out)
- Crosshair cursor (CSS custom cursor or drawn on canvas following mouse/touch)
- Laser beam: brief line drawn from bottom-center of screen to click point (fades quickly)
- Hit combo text: floating "+1" text that drifts up and fades from hit location
- Timer: circular countdown ring in top-left, depleting like a clock, turns red under 10 seconds
- 3-2-1-GO! countdown before game starts (with escalating beep sounds)

**HUD Elements:**
- Top-left: Timer (circular countdown)
- Top-right: Score (current hits / target needed, e.g., "5 / 8 🎯")
- Bottom-center: "TAP THE TARGETS!" instruction text (fades after 5 seconds)

**Win Screen:**
- "MISSION COMPLETE!" in giant glowing text
- Star rating animation (3 stars fly in one at a time)
- Score summary
- "RETURN TO HQ" button
- Confetti/particle explosion

---

### Screen 4: MISSION 02 — "Code Cracker" (Pattern Memory)

**Concept:** A Simon-says style memory game where the player must repeat an increasingly long sequence of colored panels. Themed as "cracking an encryption code" to access secret files.

**Implementation: DOM-based (React components)**

**Game Mechanics:**
- 4 colored panels arranged in a 2×2 grid (not a cross — easier for small hands on mobile)
- Colors: Neon Green, Electric Cyan, Hot Magenta, Laser Red — each with distinct glow
- Round 1: Sequence of 2 flashes
- Round 2: Sequence of 3 flashes
- Round 3: Sequence of 4 flashes
- Win condition: Complete all 3 rounds. That's it — short and sweet for 6-year-olds.
- Fail: Wrong button pressed — friendly "SEQUENCE ERROR!" message with option to retry current round (forgiving!)
- Each panel flash: panel brightens intensely + unique tone (Web Audio API — 4 distinct musical notes, e.g., C4, E4, G4, B4)
- Player taps: panel lights up + plays its tone
- Sequence playback speed: ~800ms per flash (slow enough for kids to follow)
- Between rounds: "ENCRYPTION LEVEL [N] — WATCH CAREFULLY!" message

**Visual Details:**
- Background: "code rain" effect (Matrix-style falling characters in green, but using numbers and simple symbols — very subtle, decorative only)
- Panels: Large rounded squares with thick neon borders, dark fill that brightens on activation
- Each panel labeled with a shape symbol for accessibility (◆ ■ ▲ ●) — so color-blind kids can play too
- Current round indicator: "LEVEL 1/3 🔐" at top
- When panel flashes in sequence: gentle pulse animation + glow intensity increase
- On correct sequence: panels all flash simultaneously in gold + "ACCESS GRANTED" text + unlock sound
- On error: panels briefly flash red + "glitch" screen effect (brief CSS transform skew + opacity flicker)

**Win Screen:**
- "CODE CRACKED!" title with decrypt animation (scrambled text resolving into readable text)
- Animated file folder opening to reveal a "TOP SECRET" stamp
- "RETURN TO HQ" button

---

### Screen 5: MISSION 03 — "Laser Maze" (Maze Navigation)

**Concept:** Navigate a small character (a little agent/robot avatar) through a simple maze while avoiding "laser beams" (animated horizontal/vertical lines that toggle on/off). Touch-friendly movement.

**Implementation: Canvas 2D Game**

**Game Mechanics:**
- Small grid-based maze (8×8 or 10×10 — simple, not complex)
- Player character: a small glowing circle/dot (the "agent") with a trail effect
- Movement: 
  - Mobile: On-screen D-pad (Up/Down/Left/Right arrow buttons) — large, touch-friendly
  - Desktop: Arrow keys OR on-screen D-pad
  - Swiping: Optional swipe gesture support
- Laser beams: Horizontal and vertical lines that blink on/off at regular intervals (1.5s on, 1.5s off)
- Lasers are visually obvious: bright red lines with glow, with a "warming up" flicker before activating
- Touching a laser: Player respawns at last checkpoint (NOT back to start — keep it fun!)
- Checkpoints: 2 mid-maze checkpoints (glowing green circles that activate when touched)
- Goal: Reach the exit portal (animated swirling purple/cyan vortex)
- No time limit — let kids take their time. This is about fun exploration, not stress.
- Maze is pre-designed (not randomly generated) — carefully crafted to be solvable by a 6-year-old with clear visual paths

**Visual Details:**
- Maze walls: neon blue lines on dark background (glowing)
- Player: bright green glowing dot with a fading trail (last 5-8 positions shown as decreasing opacity dots)
- Lasers: red beams that pulse/flicker, with small "emitter" squares at the wall where they originate
- Laser warning: 0.5s before a laser activates, its emitter flashes yellow (visual cue!)
- Checkpoints: Pulsing green rings that fill in and turn gold when activated
- Exit portal: Animated rotating rings with particle effects pulling inward (like a vortex)
- On laser hit: screen flashes red briefly, player "respawns" with a teleport effect at checkpoint
- Camera: Maze fits entirely on screen (no scrolling — keeps it simple)

**D-Pad Controller:**
- Positioned at bottom-center of screen
- Large circular buttons with arrow symbols
- Neon green with glow effect
- Press feedback: button brightens + slight scale
- Fixed position (doesn't move with scroll)

**Win Screen:**
- Player reaches portal → "warp" animation (screen spirals inward)
- "MAZE CLEARED!" with agent coming out the other side
- "RETURN TO HQ" button

---

### Screen 6: INVITATION UNLOCK — The Grand Finale!

**Triggered when:** All 3 missions are completed and player clicks "DECRYPT INVITATION" on the Hub screen.

**The Unlock Sequence (Cinematic!):**
1. Screen goes dark
2. "DECRYPTING TOP SECRET FILE..." text with progress bar (fake, animated over 3 seconds)
3. "Decryption" glitch effects (screen flickers, random characters)
4. Progress hits 100% — screen flash to white
5. "ACCESS GRANTED" stamp slams down (with impact sound + screen shake)
6. Invitation card fades/zooms in with a shower of confetti particles + victory fanfare music

**The Invitation Card:**
- Centered card with a premium feel — slightly angled (CSS perspective transform for 3D tilt)
- Styled like a "TOP SECRET" dossier that's been declassified
- Neon border glow cycling through theme colors
- Content (all customizable via constants at top of code):

```
🎯 MISSION BRIEFING: BIRTHDAY PARTY! 🎯

Agent [PLAYER_NAME], you have proven yourself worthy!

You are hereby invited to join the ultimate mission:

🎂 [BIRTHDAY KID'S NAME]'s 6th Birthday Party! 🎂

📅 DATE: [Date]
🕐 TIME: [Start Time] – [End Time]
📍 LOCATION: [Laser Tag Venue Name]
📍 ADDRESS: [Full Address]

⚡ MISSION DETAILS: ⚡
Laser Tag • Pizza • Cake • Fun!

👤 RSVP TO: [Parent Name]
📱 CALL/TEXT: [Phone Number]
📧 EMAIL: [Email Address]
⏰ RSVP BY: [RSVP Deadline Date]

"See you on the battlefield, Agent!"
```

- Each line animates in with stagger (typewriter effect or slide-in)
- Background: Subtle animated stars/particles continuing
- Confetti continues gently falling
- Card has slight hover-tilt effect (CSS perspective transform on mousemove — fun interactive touch)
- RSVP button at bottom that could link to a text message or email (tel: or mailto: link)

---

## 🔧 Configuration / Customization

All party-specific details should be defined as constants at the very top of the file for easy editing:

```javascript
const PARTY_CONFIG = {
  birthdayKidName: "YOUR KID'S NAME",
  kidAge: 6,
  partyDate: "Saturday, [Month] [Day], [Year]",
  partyTimeStart: "[Start Time]",
  partyTimeEnd: "[End Time]",
  venueName: "[Laser Tag Place Name]",
  venueAddress: "[Full Street Address, City, State ZIP]",
  rsvpName: "[Your Name]",
  rsvpPhone: "[Phone Number]",
  rsvpEmail: "[Email Address]",
  rsvpDeadline: "[RSVP By Date]",
  missionDetails: "Laser Tag • Pizza • Cake • Fun!",
};
```

---

## 🎵 Sound Design Specification

Since we can't host external audio files in a React artifact, ALL sounds must be generated using the Web Audio API:

### Sound Generation Functions Needed:
1. **`playLaserSound()`** — Short sine wave sweep from 800Hz to 200Hz over 100ms (pew pew!)
2. **`playExplosion()`** — White noise burst 200ms with bandpass filter sweep
3. **`playPowerUp()`** — Ascending arpeggio: play notes C5, E5, G5, C6 rapidly (50ms each)
4. **`playError()`** — Low square wave 150Hz for 200ms
5. **`playClick()`** — Short tick: 1000Hz sine wave, 30ms duration
6. **`playCountdown()`** — Single beep: 600Hz for 100ms (play 3 times for 3-2-1)
7. **`playVictory()`** — Major chord: C4+E4+G4+C5 played simultaneously for 500ms with reverb/delay
8. **`playSimonNote(index)`** — 4 distinct tones for the memory game panels (C4, E4, G4, B4) — 300ms sustained sine waves
9. **`playUnlock()`** — Dramatic ascending sweep from 200Hz to 2000Hz over 1s + final chord hit
10. **`playBackgroundPulse()`** — Optional subtle rhythmic pulse for ambiance (low bass note at BPM intervals)

### Audio Context Management:
- Create AudioContext on first user interaction (click on Start button)
- Pass context to all sound functions
- Include global mute toggle (stored in state)
- Volume control: master gain node at 0.3 default (not too loud)

---

## ✨ Particle System Specification

A reusable particle system is critical for the visual wow-factor:

### Particle Class/Object:
```
{
  x, y,           // position
  vx, vy,         // velocity
  life,            // remaining lifetime (0-1)
  maxLife,         // total lifetime
  color,           // hex color string
  size,            // radius
  decay,           // life reduction per frame
  gravity,         // optional downward pull
  shape,           // 'circle' | 'square' | 'star'
}
```

### Particle Emitter Presets:
1. **`burstExplosion(x, y, color, count=20)`** — Radial burst, particles fly outward and fade
2. **`confetti(canvasWidth)`** — Falling rectangles in random party colors from top
3. **`sparkle(x, y)`** — Gentle twinkling particles that float upward and fade (for magic/unlock effects)
4. **`laserTrail(x1, y1, x2, y2, color)`** — Particles along a line that fade quickly
5. **`vortex(x, y)`** — Particles spiral inward (for the maze portal)

### Implementation:
- Use a Canvas overlay on top of the entire app for global particle effects (confetti, sparkles)
- Game-specific particles render within their own canvas
- Update loop via requestAnimationFrame
- Pool/recycle particles for performance (max 200 active particles)

---

## 📱 Responsive Layout Breakpoints

```
Mobile Portrait:  320px – 480px  (primary target — most parents will text the link)
Mobile Landscape: 481px – 812px
Tablet:           813px – 1024px
Desktop:          1025px+
```

### Key Responsive Behaviors:
- Mission cards: horizontal row on tablet+ → vertical stack on mobile
- Game canvases: scale to fit viewport with maintained aspect ratio (max 600x600)
- D-pad: only shown on touch devices (detect via matchMedia or pointer events)
- Font sizes: clamp() for fluid scaling
- Invitation card: full-width on mobile with padding, max-width 500px on desktop

---

## 🧩 Component Architecture

```
<App>
├── <ParticleOverlay />          // Global confetti/sparkle effects (Canvas)
├── <SoundEngine />              // Audio context provider
├── <ScreenTransition />         // Wipe/portal transition between screens
│
├── <TitleScreen />              // Screen 1
│   ├── <AnimatedTitle />
│   ├── <StarField />            // Animated background
│   ├── <AgentNameInput />
│   └── <StartButton />
│
├── <MissionHub />               // Screen 2
│   ├── <MissionCard /> × 3
│   ├── <ProgressBar />
│   └── <DecryptButton />        // Appears when all complete
│
├── <TargetPractice />           // Screen 3 — Mini-game 1
│   ├── <GameCanvas />
│   ├── <HUD />                  // Timer + Score
│   └── <ResultScreen />
│
├── <CodeCracker />              // Screen 4 — Mini-game 2
│   ├── <SimonPanel /> × 4
│   ├── <LevelIndicator />
│   └── <ResultScreen />
│
├── <LaserMaze />                // Screen 5 — Mini-game 3
│   ├── <MazeCanvas />
│   ├── <DPadController />
│   └── <ResultScreen />
│
└── <InvitationReveal />         // Screen 6
    ├── <DecryptAnimation />
    ├── <InvitationCard />
    └── <RSVPButton />
```

---

## 🎯 Difficulty Calibration (CRITICAL for 6-year-olds)

This game is an INVITATION DELIVERY MECHANISM, not a rage game. Every child MUST be able to complete it. Design for the least experienced player.

### Principles:
1. **No child should get stuck.** If they fail, retry is instant and free.
2. **No punishment.** Misses/errors have brief visual feedback but no score penalty, no lives system.
3. **Generous win conditions.** Target Practice needs 8/~16 hits (50%). Memory game is only 3 short rounds. Maze has checkpoints and no timer.
4. **Visual clarity.** Targets are BIG. Buttons are BIG. Hit areas are generous (add extra padding to touch targets).
5. **Minimal text.** Use icons/visuals over text instructions. When text is needed, keep it under 8 words.
6. **Quick games.** Each mini-game takes 30-90 seconds max. Total experience: 5-8 minutes.
7. **Always winnable.** If a kid fails Target Practice 3 times in a row, consider auto-passing them with a consolation message ("COMMAND HAS GRANTED YOU A FIELD PROMOTION!"). This is configurable.
8. **Parent escape hatch.** A small, subtle "Skip to Invite" link somewhere discreet (like footer text) for parents who just need the info. Maybe requiring a triple-tap to activate.

---

## 🔐 Parent Escape Hatch

Hidden skip mechanism for parents who just want the invitation:
- Small text at very bottom of title screen: "Parents: tap here 3 times" (in muted gray, small font)
- Triple-tap triggers a simple confirmation ("Skip games and view invitation?")
- Goes directly to the invitation card
- Does NOT ruin the experience for kids who scroll down accidentally (requires deliberate triple-tap)

---

## 🌈 CSS Animation Library Needed

Define these as reusable CSS @keyframes:

1. **`neonPulse`** — alternating text-shadow intensity (glow brighter/dimmer)
2. **`float`** — gentle vertical bobbing (translateY oscillation)
3. **`slideInFromLeft`** / **`slideInFromRight`** / **`slideInFromBottom`**
4. **`fadeInUp`** — opacity 0→1 + translateY 20px→0
5. **`scaleIn`** — scale 0→1 with slight overshoot (cubic-bezier bounce)
6. **`shake`** — rapid translateX jitter (for screen shake)
7. **`glitch`** — clip-path based glitch flicker effect
8. **`rotate360`** — continuous rotation (for loading spinners, portal)
9. **`gradientShift`** — background-position animation for moving gradients
10. **`typewriter`** — width 0→100% with steps() timing (for invitation text)
11. **`confettiFall`** — translateY -100% to 100% with slight rotateZ wobble
12. **`scanline`** — moving semi-transparent line for screen transition effect

---

## 🚀 Hosting & Sharing

The final output is a single React `.jsx` artifact file. To share:
1. Deploy to Vercel, Netlify, or GitHub Pages (wrap in a minimal Create React App / Vite shell)
2. OR use Claude's artifact sharing feature to get a shareable link
3. Share the link via group text to parents
4. Link works on any device with a modern browser

---

---

# 📋 MASTER TODO LIST

This is the authoritative tracking document. Update status after each implementation step. Check for gaps and add new items as discovered.

## Legend
- ⬜ Not Started
- 🔨 In Progress
- ✅ Complete
- 🔍 Needs Review/Testing
- ⚠️ Blocked/Issue

---

## Phase 0: Foundation & Infrastructure
- ⬜ **T-001**: Set up base React component structure with App shell and screen state management
- ⬜ **T-002**: Implement PARTY_CONFIG constants object at top of file with all customizable fields
- ⬜ **T-003**: Import Google Fonts (Orbitron, Exo 2, Press Start 2P) via @import in style block
- ⬜ **T-004**: Define CSS custom properties (variables) for all theme colors
- ⬜ **T-005**: Define all CSS @keyframes animations (neonPulse, float, shake, glitch, fadeInUp, scaleIn, slideIn variants, gradientShift, typewriter, confettiFall, scanline, rotate360)
- ⬜ **T-006**: Build responsive base styles with mobile-first approach and clamp() font sizing
- ⬜ **T-007**: Implement screen transition system (state-driven, with enter/exit animations)

## Phase 1: Audio Engine
- ⬜ **T-010**: Create AudioContext initialization on first user interaction
- ⬜ **T-011**: Implement master gain node with mute toggle state
- ⬜ **T-012**: Build `playLaserSound()` — sine wave sweep 800Hz→200Hz, 100ms
- ⬜ **T-013**: Build `playExplosion()` — white noise burst with bandpass filter
- ⬜ **T-014**: Build `playPowerUp()` — ascending arpeggio C5-E5-G5-C6
- ⬜ **T-015**: Build `playError()` — low square wave 150Hz, 200ms
- ⬜ **T-016**: Build `playClick()` — 1000Hz tick, 30ms
- ⬜ **T-017**: Build `playCountdown()` — 600Hz beep, 100ms
- ⬜ **T-018**: Build `playVictory()` — major chord C4+E4+G4+C5, 500ms
- ⬜ **T-019**: Build `playSimonNote(index)` — 4 distinct tones, 300ms sustained
- ⬜ **T-020**: Build `playUnlock()` — dramatic ascending sweep + final chord
- ⬜ **T-021**: Build mute/unmute button component (speaker icon, positioned fixed)

## Phase 2: Particle System
- ⬜ **T-025**: Create Particle class/object with position, velocity, life, color, size, decay, gravity, shape properties
- ⬜ **T-026**: Build particle update loop (requestAnimationFrame based)
- ⬜ **T-027**: Build particle renderer (Canvas 2D drawing function)
- ⬜ **T-028**: Implement `burstExplosion(x, y, color, count)` preset
- ⬜ **T-029**: Implement `confetti(canvasWidth)` preset — falling party rectangles
- ⬜ **T-030**: Implement `sparkle(x, y)` preset — floating upward twinkling
- ⬜ **T-031**: Implement `laserTrail(x1, y1, x2, y2, color)` preset
- ⬜ **T-032**: Implement `vortex(x, y)` preset — inward spiral
- ⬜ **T-033**: Build ParticleOverlay component — full-screen canvas for global effects
- ⬜ **T-034**: Implement particle pooling/recycling (max 200 active)

## Phase 3: Title Screen
- ⬜ **T-040**: Build TitleScreen component with dark background
- ⬜ **T-041**: Create animated perspective grid floor (CSS 3D perspective)
- ⬜ **T-042**: Build StarField background animation (twinkling dots)
- ⬜ **T-043**: Create animated title "OPERATION: LASER BIRTHDAY" with rainbow neon glow cycling
- ⬜ **T-044**: Create flickering "TOP SECRET MISSION BRIEFING" subtitle
- ⬜ **T-045**: Build Agent Name Input (terminal style — green on black, blinking cursor)
- ⬜ **T-046**: Build "START MISSION" button with pulse/glow animation
- ⬜ **T-047**: Add random decorative laser beams shooting across background
- ⬜ **T-048**: Implement staggered entrance animation sequence
- ⬜ **T-049**: Build parent escape hatch — triple-tap skip text at bottom
- ⬜ **T-050**: Wire up START button → Mission Hub transition with power-up effect

## Phase 4: Mission Hub
- ⬜ **T-055**: Build MissionHub layout (command center dashboard)
- ⬜ **T-056**: Build MissionCard component with states: LOCKED / READY / COMPLETE
- ⬜ **T-057**: Implement sequential unlock logic (mission N+1 unlocks when N completes)
- ⬜ **T-058**: Build mission progress bar with neon fill animation (0/3 → 3/3)
- ⬜ **T-059**: Implement LOCKED card visual (static/glitch overlay, not clickable)
- ⬜ **T-060**: Implement READY card visual (glow, hover scale-up, clickable)
- ⬜ **T-061**: Implement COMPLETE card visual (holographic checkmark + sparkle animation)
- ⬜ **T-062**: Build "DECRYPT INVITATION" mega-button (appears when 3/3 complete)
- ⬜ **T-063**: Implement progress bar explosion into particles at 3/3
- ⬜ **T-064**: Wire up card click → game screen transitions

## Phase 5: Mission 01 — Target Practice
- ⬜ **T-070**: Build TargetPractice component with Canvas setup
- ⬜ **T-071**: Implement 3-2-1-GO countdown with beep sounds
- ⬜ **T-072**: Build target spawning system (random positions, 2-3s lifespan, 1-2 visible)
- ⬜ **T-073**: Draw targets (concentric glowing rings, pulsing)
- ⬜ **T-074**: Implement click/tap detection with generous hit areas
- ⬜ **T-075**: Build laser beam effect (line from bottom-center to click point)
- ⬜ **T-076**: Implement hit feedback: particle burst + score increment + floating "+1" text + laser sound
- ⬜ **T-077**: Implement miss feedback: brief red flash + miss sound (no penalty)
- ⬜ **T-078**: Build HUD — circular countdown timer (ring depleting, red under 10s)
- ⬜ **T-079**: Build HUD — score display (current / target in arcade font)
- ⬜ **T-080**: Build crosshair cursor (custom CSS cursor or canvas-drawn reticle following pointer)
- ⬜ **T-081**: Implement win condition check (8+ hits)
- ⬜ **T-082**: Build win screen (MISSION COMPLETE, star rating animation, score summary)
- ⬜ **T-083**: Build fail screen (encouraging retry message, instant retry button)
- ⬜ **T-084**: Implement auto-pass safety net after 3 failures (configurable)
- ⬜ **T-085**: Wire up "RETURN TO HQ" → Mission Hub with mission 1 marked complete

## Phase 6: Mission 02 — Code Cracker
- ⬜ **T-090**: Build CodeCracker component with 2×2 panel grid
- ⬜ **T-091**: Build SimonPanel component (large colored squares with shape icons for accessibility)
- ⬜ **T-092**: Style panels: neon borders (green/cyan/magenta/red), dark fill, active state glow
- ⬜ **T-093**: Implement sequence generation (random, increasing length: 2, 3, 4)
- ⬜ **T-094**: Implement sequence playback animation (800ms per flash, panel brightens + tone)
- ⬜ **T-095**: Implement player input phase — tap detection, panel lights up + plays tone
- ⬜ **T-096**: Implement sequence comparison — correct input advances, wrong input shows error
- ⬜ **T-097**: Build level indicator display ("ENCRYPTION LEVEL 1/3 🔐")
- ⬜ **T-098**: Build "WATCH CAREFULLY" intro text between rounds
- ⬜ **T-099**: Implement correct round feedback: panels flash gold + "ACCESS GRANTED" + unlock sound
- ⬜ **T-100**: Implement error feedback: panels flash red + glitch effect + retry current round
- ⬜ **T-101**: Add subtle code rain background effect (Matrix-style falling characters)
- ⬜ **T-102**: Build win screen (CODE CRACKED, decrypt animation, file folder reveal)
- ⬜ **T-103**: Wire up "RETURN TO HQ" → Mission Hub with mission 2 marked complete

## Phase 7: Mission 03 — Laser Maze
- ⬜ **T-110**: Build LaserMaze component with Canvas setup
- ⬜ **T-111**: Design maze layout (8×8 or 10×10 grid, simple paths, pre-defined)
- ⬜ **T-112**: Render maze walls (neon blue glowing lines)
- ⬜ **T-113**: Render player character (green glowing dot with trail effect)
- ⬜ **T-114**: Implement player movement (grid-based, arrow keys + on-screen D-pad)
- ⬜ **T-115**: Build D-Pad controller component (large touch-friendly arrow buttons)
- ⬜ **T-116**: Show/hide D-pad based on touch device detection
- ⬜ **T-117**: Implement laser beams — horizontal/vertical, toggle on/off at intervals
- ⬜ **T-118**: Implement laser warning system — emitters flash yellow 0.5s before activation
- ⬜ **T-119**: Implement laser collision detection with player
- ⬜ **T-120**: Implement checkpoint system (2 mid-maze, save respawn point)
- ⬜ **T-121**: Build checkpoint visuals (pulsing green rings → gold when activated)
- ⬜ **T-122**: Implement laser hit response — screen flash red, respawn at checkpoint
- ⬜ **T-123**: Build exit portal (animated rotating rings + vortex particles)
- ⬜ **T-124**: Implement win condition — player reaches portal
- ⬜ **T-125**: Build win screen (warp animation, MAZE CLEARED)
- ⬜ **T-126**: Wire up "RETURN TO HQ" → Mission Hub with mission 3 marked complete

## Phase 8: Invitation Unlock Sequence
- ⬜ **T-130**: Build InvitationReveal component
- ⬜ **T-131**: Implement decrypt progress bar animation (fake 3s loading with glitch effects)
- ⬜ **T-132**: Build "DECRYPTING TOP SECRET FILE..." text with scramble effect
- ⬜ **T-133**: Implement "ACCESS GRANTED" stamp animation (slam down + screen shake + sound)
- ⬜ **T-134**: Build InvitationCard component with all PARTY_CONFIG data
- ⬜ **T-135**: Style card as "TOP SECRET dossier" — neon border glow cycling colors
- ⬜ **T-136**: Implement staggered line-by-line text reveal (typewriter or slide-in)
- ⬜ **T-137**: Add confetti particle shower on reveal
- ⬜ **T-138**: Implement 3D tilt/hover effect on card (CSS perspective transform)
- ⬜ **T-139**: Build RSVP button (tel: and/or mailto: link)
- ⬜ **T-140**: Verify all PARTY_CONFIG fields render correctly in invitation

## Phase 9: Polish & Integration
- ⬜ **T-145**: Full playthrough test — complete all 3 games → verify invitation shows
- ⬜ **T-146**: Test screen transitions (all 6 screens, forward and back navigation)
- ⬜ **T-147**: Test responsive layout on 360px, 390px, 768px, 1024px, 1440px widths
- ⬜ **T-148**: Test all audio functions play correctly (no errors, no overlap issues)
- ⬜ **T-149**: Test mute toggle persists across screens
- ⬜ **T-150**: Test parent escape hatch (triple-tap → invitation)
- ⬜ **T-151**: Test Agent Name flows through to invitation personalization
- ⬜ **T-152**: Test auto-pass safety net on Target Practice
- ⬜ **T-153**: Verify touch interactions on all games (no hover-only states)
- ⬜ **T-154**: Performance check — 60fps on game canvases, no jank on transitions
- ⬜ **T-155**: Verify no console errors
- ⬜ **T-156**: Accessibility pass — ensure shape icons on Simon panels, sufficient contrast, focusable elements
- ⬜ **T-157**: Final visual polish — verify all neon glows, animations, particles render correctly
- ⬜ **T-158**: Cross-browser sanity check (Chrome, Safari, Firefox — at minimum)

## Phase 10: Delivery
- ⬜ **T-160**: Update PARTY_CONFIG with real party details (or leave clear placeholders with instructions)
- ⬜ **T-161**: Final playthrough with real party data
- ⬜ **T-162**: Generate artifact / deploy to hosting
- ⬜ **T-163**: Test shared link on iPhone and Android
- ⬜ **T-164**: Share with invitees!

---

## Gap Tracking Log

| Date | Gap Found | Resolution | TODO Added |
|------|-----------|------------|------------|
| — | Initial plan created | N/A | T-001 through T-164 |
| | | | |

*Update this table each time a gap is identified during implementation.*

---

## Implementation Notes for Claude Code

### Critical Reminders:
1. **Single file**: Everything must be in ONE `.jsx` React artifact file. No separate CSS/JS files.
2. **No localStorage**: All state in React useState/useReducer. Storage API is available if persistence between sessions is needed.
3. **No external audio files**: All sound via Web Audio API synthesis.
4. **Tailwind only for utility classes**: Complex animations/styles need inline CSS or style tags.
5. **Test after each phase**: Don't build all 10 phases then test. Build → test → fix → next phase.
6. **Mobile first**: Test at 375px width throughout development.
7. **Fun first**: If something isn't fun or feels frustrating for a 6-year-old, redesign it. The priority is: Playable > Pretty > Perfect.

### Build Order Recommendation:
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10

Do NOT skip phases or build out of order. Each phase depends on the prior ones. The sound engine and particle system must exist before building games that use them.

---

*This document is the single source of truth. Update it as implementation proceeds.*
