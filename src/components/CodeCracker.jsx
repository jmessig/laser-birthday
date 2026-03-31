import { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_CONFIG } from '../config';
import { playSimonNote, playError, playVictory, playPowerUp, playClick } from '../audio';

const PANEL_COLORS = [
  { bg: '#0a2e0a', active: '#39FF14', border: '#39FF14', glow: 'var(--glow-green)', shape: '\u25C6' },   // Diamond
  { bg: '#0a1e2e', active: '#00FFFF', border: '#00FFFF', glow: 'var(--glow-cyan)', shape: '\u25A0' },    // Square
  { bg: '#2e0a2e', active: '#FF00FF', border: '#FF00FF', glow: 'var(--glow-magenta)', shape: '\u25B2' }, // Triangle
  { bg: '#2e0a0a', active: '#FF073A', border: '#FF073A', glow: 'var(--glow-red)', shape: '\u25CF' },     // Circle
];

const STATES = { INTRO: 0, SHOWING: 1, INPUT: 2, CORRECT: 3, ERROR: 4, WIN: 5 };

export default function CodeCracker({ onComplete, onBack }) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState(STATES.INTRO);
  const [activePanel, setActivePanel] = useState(-1);
  const [goldFlash, setGoldFlash] = useState(false);
  const [glitchEffect, setGlitchEffect] = useState(false);
  const sequencesRef = useRef([]);
  const inputIndexRef = useRef(0);
  const timeoutRef = useRef(null);

  // Generate all sequences upfront
  useEffect(() => {
    const seqs = GAME_CONFIG.simonSequenceLengths.map(len =>
      Array.from({ length: len }, () => Math.floor(Math.random() * 4))
    );
    sequencesRef.current = seqs;
  }, []);

  // Start showing sequence after intro
  useEffect(() => {
    if (phase === STATES.INTRO) {
      timeoutRef.current = setTimeout(() => showSequence(), 1500);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [phase, round]);

  const showSequence = useCallback(() => {
    setPhase(STATES.SHOWING);
    const seq = sequencesRef.current[round];
    if (!seq) return;

    let i = 0;
    const flash = () => {
      if (i >= seq.length) {
        setActivePanel(-1);
        setTimeout(() => {
          setPhase(STATES.INPUT);
          inputIndexRef.current = 0;
        }, 400);
        return;
      }
      setActivePanel(seq[i]);
      playSimonNote(seq[i]);
      setTimeout(() => {
        setActivePanel(-1);
        i++;
        setTimeout(flash, 200);
      }, GAME_CONFIG.simonFlashDuration);
    };
    setTimeout(flash, 500);
  }, [round]);

  const handlePanelClick = useCallback((panelIndex) => {
    if (phase !== STATES.INPUT) return;

    setActivePanel(panelIndex);
    playSimonNote(panelIndex);
    setTimeout(() => setActivePanel(-1), 200);

    const seq = sequencesRef.current[round];
    const expected = seq[inputIndexRef.current];

    if (panelIndex === expected) {
      inputIndexRef.current++;
      if (inputIndexRef.current >= seq.length) {
        // Round complete!
        if (round >= GAME_CONFIG.simonRounds - 1) {
          // All rounds done — WIN!
          setGoldFlash(true);
          playVictory();
          setTimeout(() => {
            setGoldFlash(false);
            setPhase(STATES.WIN);
          }, 800);
        } else {
          // Next round
          setGoldFlash(true);
          playPowerUp();
          setTimeout(() => {
            setGoldFlash(false);
            setRound(r => r + 1);
            setPhase(STATES.INTRO);
          }, 1200);
        }
      }
    } else {
      // Wrong!
      playError();
      setGlitchEffect(true);
      setPhase(STATES.ERROR);
      setTimeout(() => {
        setGlitchEffect(false);
        inputIndexRef.current = 0;
        setPhase(STATES.INTRO);
      }, 1200);
    }
  }, [phase, round]);

  return (
    <div
      className={`screen ${glitchEffect ? 'anim-glitch' : ''}`}
      style={{ background: 'var(--bg-deep)', gap: 'clamp(12px, 3vh, 24px)', padding: '20px' }}
    >
      {/* Code rain background */}
      <CodeRain />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px, 3vh, 24px)', width: '100%' }}>
        {/* Level indicator */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.7rem, 2vw, 1rem)',
          color: 'var(--electric-cyan)',
          textShadow: 'var(--glow-cyan)',
          letterSpacing: '2px',
        }}>
          ENCRYPTION LEVEL {round + 1}/{GAME_CONFIG.simonRounds} {'\u{1F510}'}
        </div>

        {/* Phase message */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.6rem, 1.5vw, 0.85rem)',
          color: phase === STATES.ERROR ? 'var(--laser-red)' : '#ffffff88',
          textShadow: phase === STATES.ERROR ? 'var(--glow-red)' : 'none',
          letterSpacing: '2px',
          minHeight: '1.5em',
          transition: 'color 0.3s',
        }}>
          {phase === STATES.INTRO && 'WATCH CAREFULLY!'}
          {phase === STATES.SHOWING && 'MEMORIZE THE SEQUENCE...'}
          {phase === STATES.INPUT && 'YOUR TURN - REPEAT THE CODE!'}
          {phase === STATES.ERROR && 'SEQUENCE ERROR! RETRYING...'}
          {phase === STATES.CORRECT && 'ACCESS GRANTED!'}
        </div>

        {/* 2x2 Panel Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'clamp(8px, 2vw, 16px)',
          width: 'min(360px, 80vw)',
          aspectRatio: '1',
        }}>
          {PANEL_COLORS.map((panel, i) => (
            <button
              key={i}
              onClick={() => handlePanelClick(i)}
              disabled={phase !== STATES.INPUT}
              style={{
                background: activePanel === i || goldFlash
                  ? goldFlash ? '#FFD700' : panel.active
                  : panel.bg,
                border: `3px solid ${goldFlash ? '#FFD700' : panel.border}`,
                borderRadius: '12px',
                cursor: phase === STATES.INPUT ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                boxShadow: activePanel === i
                  ? `0 0 30px ${panel.active}, 0 0 60px ${panel.active}88`
                  : goldFlash
                  ? 'var(--glow-gold)'
                  : `0 0 5px ${panel.border}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(2rem, 8vw, 3.5rem)',
                color: activePanel === i ? '#000' : panel.border + '88',
                textShadow: activePanel === i ? 'none' : `0 0 10px ${panel.border}44`,
                minHeight: 'clamp(80px, 18vw, 140px)',
                touchAction: 'manipulation',
              }}
            >
              {panel.shape}
            </button>
          ))}
        </div>

        {/* Back button */}
        {phase !== STATES.WIN && (
          <button
            onClick={() => { playClick(); onBack(); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff33',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-display)',
              letterSpacing: '1px',
            }}
          >
            Back to HQ
          </button>
        )}
      </div>

      {/* Win Screen */}
      {phase === STATES.WIN && (
        <div className="anim-scale-in" style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a1aee',
          zIndex: 10,
          gap: '20px',
        }}>
          <h2 className="title-lg anim-rainbow" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
          }}>
            CODE CRACKED!
          </h2>
          <div className="anim-pulse-scale" style={{ fontSize: '3rem' }}>
            {'\u{1F4C2}\u{1F510}'}
          </div>
          <p style={{
            color: 'var(--neon-green)',
            textShadow: 'var(--glow-green)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(0.7rem, 2vw, 1rem)',
            letterSpacing: '2px',
          }}>
            ALL FILES DECRYPTED
          </p>
          <button className="btn-neon" onClick={onComplete}>
            RETURN TO HQ
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// CODE RAIN BACKGROUND
// ============================================
function CodeRain() {
  const [columns] = useState(() => {
    const cols = [];
    const count = Math.floor(window.innerWidth / 25);
    for (let i = 0; i < count; i++) {
      cols.push({
        x: (i / count) * 100,
        chars: Array.from({ length: 8 + Math.floor(Math.random() * 12) }, () =>
          String.fromCharCode(48 + Math.floor(Math.random() * 10))
        ),
        speed: 15 + Math.random() * 25,
        delay: Math.random() * 10,
        opacity: 0.03 + Math.random() * 0.06,
      });
    }
    return cols;
  });

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      {columns.map((col, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${col.x}%`,
            top: '-20%',
            color: '#39FF14',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '18px',
            opacity: col.opacity,
            whiteSpace: 'pre',
            animation: `codeRainFall ${col.speed}s linear ${col.delay}s infinite`,
            textShadow: '0 0 5px #39FF14',
          }}
        >
          {col.chars.map((ch, j) => (
            <div key={j}>{ch}</div>
          ))}
        </div>
      ))}
      <style>{`
        @keyframes codeRainFall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(120vh); }
        }
      `}</style>
    </div>
  );
}
