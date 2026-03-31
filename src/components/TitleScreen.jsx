import { useState, useEffect, useRef } from 'react';
import { playClick, playPowerUp, playError } from '../audio';

const VERIFY_STATES = {
  IDLE: 'idle',
  CHECKING: 'checking',
  APPROVED: 'approved',
  NEED_FULLNAME: 'need_fullname',
  DENIED: 'denied',
};

export default function TitleScreen({ onStart, onSkip, ensureAudio }) {
  const [agentName, setAgentName] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [skipTaps, setSkipTaps] = useState(0);
  const [entered, setEntered] = useState(false);
  const [verifyState, setVerifyState] = useState(VERIFY_STATES.IDLE);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const skipTimerRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleStart = async () => {
    ensureAudio();
    const name = agentName.trim();
    if (!name) {
      setErrorMsg('Enter your codename, Agent!');
      playError();
      return;
    }

    setVerifyState(VERIFY_STATES.CHECKING);
    setErrorMsg('');

    try {
      const res = await fetch('/api/verify-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (data.authorized) {
        setVerifyState(VERIFY_STATES.APPROVED);
        playPowerUp();
        setTimeout(() => onStart(name), 400);
      } else {
        setVerifyState(VERIFY_STATES.NEED_FULLNAME);
        playClick();
      }
    } catch {
      // If API is unreachable (dev mode), allow through
      setVerifyState(VERIFY_STATES.APPROVED);
      playPowerUp();
      setTimeout(() => onStart(name), 400);
    }
  };

  const handleFullNameSubmit = async () => {
    ensureAudio();
    const f = firstName.trim();
    const l = lastName.trim();
    if (!f || !l) {
      setErrorMsg('Please enter your full name');
      playError();
      return;
    }

    setVerifyState(VERIFY_STATES.CHECKING);
    setErrorMsg('');

    try {
      const res = await fetch('/api/verify-fullname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: f, lastName: l }),
      });
      const data = await res.json();

      if (data.authorized) {
        setVerifyState(VERIFY_STATES.APPROVED);
        playPowerUp();
        setTimeout(() => onStart(agentName.trim() || f), 400);
      } else {
        setVerifyState(VERIFY_STATES.DENIED);
        playError();
        setErrorMsg("Sorry, you're not on the guest list!");
      }
    } catch {
      // Fallback if API unreachable
      setVerifyState(VERIFY_STATES.APPROVED);
      playPowerUp();
      setTimeout(() => onStart(agentName.trim() || f), 400);
    }
  };

  const handleSkipTap = () => {
    ensureAudio();
    const next = skipTaps + 1;
    setSkipTaps(next);
    if (next >= 3) {
      onSkip();
      return;
    }
    clearTimeout(skipTimerRef.current);
    skipTimerRef.current = setTimeout(() => setSkipTaps(0), 2000);
  };

  const laserBeams = Array.from({ length: 6 }, (_, i) => (
    <div
      key={i}
      style={{
        position: 'absolute',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${
          ['#39FF14', '#00FFFF', '#FF00FF', '#FF073A', '#BF00FF', '#FFD700'][i]
        }, transparent)`,
        boxShadow: `0 0 8px ${['#39FF14', '#00FFFF', '#FF00FF', '#FF073A', '#BF00FF', '#FFD700'][i]}`,
        width: '25%',
        top: `${10 + i * 16}%`,
        left: '-25%',
        animation: `laserBeamShoot ${3 + i * 0.6}s linear ${i * 1.1}s infinite`,
        opacity: 0.5,
      }}
    />
  ));

  const showFullNameForm = verifyState === VERIFY_STATES.NEED_FULLNAME || verifyState === VERIFY_STATES.DENIED;

  return (
    <div className="screen" style={{ background: 'var(--bg-deep)', overflowY: 'auto' }}>
      <div className="grid-floor" />
      <StarField />
      {laserBeams}

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'clamp(10px, 2.5vh, 20px)',
        padding: '20px',
        maxWidth: '95vw',
      }}>
        {/* Top secret badge */}
        <div
          className={entered ? 'anim-fade-in-up' : ''}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(0.5rem, 1.3vw, 0.7rem)',
            color: 'var(--laser-red)',
            textShadow: 'var(--glow-red)',
            letterSpacing: '4px',
            border: '1px solid #FF073A44',
            padding: '4px 14px',
            borderRadius: '4px',
            background: '#FF073A0a',
          }}
        >
          {'\u{1F6E1}\uFE0F'} CLASSIFIED TRANSMISSION {'\u{1F6E1}\uFE0F'}
        </div>

        {/* Title */}
        <h1
          className={`title-xl anim-rainbow ${entered ? 'anim-fade-in-up delay-2' : ''}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            textAlign: 'center',
            letterSpacing: '3px',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          OPERATION:<br />LASER BIRTHDAY
        </h1>

        {/* Subtitle */}
        <p
          className={`text-lg anim-flicker ${entered ? 'anim-fade-in-up delay-3' : ''}`}
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--electric-cyan)',
            textShadow: 'var(--glow-cyan)',
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          TOP SECRET MISSION BRIEFING
        </p>

        {/* Narrative hook */}
        <div
          className={entered ? 'anim-fade-in-up delay-4' : ''}
          style={{
            maxWidth: 'min(440px, 85vw)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px',
            background: '#ffffff06',
            borderRadius: '10px',
            border: '1px solid #ffffff10',
          }}
        >
          <p style={{
            color: 'var(--electric-cyan)',
            textShadow: '0 0 8px #00FFFF44',
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.75rem, 2vw, 0.95rem)',
            lineHeight: 1.5,
          }}>
            You've been selected for a <strong style={{ color: 'var(--neon-green)', textShadow: 'var(--glow-green)' }}>top secret mission</strong>.
          </p>
          <p style={{
            color: '#ffffffaa',
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
            lineHeight: 1.5,
          }}>
            Complete 3 classified challenges to unlock a <strong style={{ color: 'var(--warm-gold)', textShadow: '0 0 8px #FFD70044' }}>secret party invitation</strong>.
          </p>
          <p style={{
            color: '#ffffff55',
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)',
            fontStyle: 'italic',
          }}>
            Think you've got what it takes, Agent?
          </p>
        </div>

        {/* Agent name input */}
        {!showFullNameForm && (
          <div
            className={entered ? 'anim-fade-in-up delay-6' : ''}
            style={{
              background: '#000',
              border: '1px solid #39FF1466',
              borderRadius: '6px',
              padding: '12px 16px',
              width: 'min(360px, 85vw)',
              fontFamily: 'monospace',
            }}
          >
            <label style={{
              color: '#39FF14aa',
              fontSize: 'clamp(0.5rem, 1.3vw, 0.7rem)',
              display: 'block',
              marginBottom: '6px',
              fontFamily: 'var(--font-display)',
              letterSpacing: '2px',
            }}>
              ENTER AGENT CODENAME:
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#39FF14', marginRight: '8px' }}>&gt;</span>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                onFocus={() => { ensureAudio(); playClick(); }}
                maxLength={30}
                placeholder=""
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#39FF14',
                  fontFamily: 'monospace',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
                  width: '100%',
                  caretColor: 'transparent',
                }}
              />
              <span style={{
                color: '#39FF14',
                opacity: showCursor ? 1 : 0,
                transition: 'opacity 0.1s',
                fontWeight: 'bold',
              }}>_</span>
            </div>
          </div>
        )}

        {/* Full name verification form */}
        {showFullNameForm && (
          <div
            className="anim-fade-in-up"
            style={{
              background: '#000',
              border: `1px solid ${verifyState === VERIFY_STATES.DENIED ? '#FF073A66' : '#00FFFF66'}`,
              borderRadius: '6px',
              padding: '16px',
              width: 'min(360px, 85vw)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <p style={{
              color: 'var(--electric-cyan)',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(0.55rem, 1.4vw, 0.7rem)',
              letterSpacing: '2px',
              textAlign: 'center',
            }}>
              {'\u{1F512}'} IDENTITY VERIFICATION REQUIRED
            </p>
            <p style={{
              color: '#ffffff88',
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.6rem, 1.5vw, 0.75rem)',
              textAlign: 'center',
            }}>
              Codename not recognized. Enter your real name to proceed.
            </p>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              style={inputStyle}
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFullNameSubmit()}
              placeholder="Last Name"
              style={inputStyle}
            />
            <button
              className="btn-neon btn-neon-cyan"
              onClick={handleFullNameSubmit}
              disabled={verifyState === VERIFY_STATES.CHECKING}
              style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.8rem)', padding: '10px 20px' }}
            >
              {verifyState === VERIFY_STATES.CHECKING ? 'VERIFYING...' : 'VERIFY IDENTITY'}
            </button>
            {verifyState === VERIFY_STATES.DENIED && (
              <p style={{
                color: 'var(--laser-red)',
                textShadow: 'var(--glow-red)',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(0.5rem, 1.3vw, 0.65rem)',
                textAlign: 'center',
                letterSpacing: '1px',
              }}>
                ACCESS DENIED — Name not on guest list
              </p>
            )}
            <button
              onClick={() => { setVerifyState(VERIFY_STATES.IDLE); setErrorMsg(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff33',
                cursor: 'pointer',
                fontSize: '0.6rem',
                fontFamily: 'var(--font-display)',
              }}
            >
              Try a different codename
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMsg && !showFullNameForm && (
          <p className="anim-fade-in-up" style={{
            color: 'var(--laser-red)',
            textShadow: 'var(--glow-red)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(0.55rem, 1.5vw, 0.7rem)',
            letterSpacing: '1px',
          }}>
            {errorMsg}
          </p>
        )}

        {/* Start button */}
        {!showFullNameForm && (
          <button
            className={`btn-neon anim-pulse-scale ${entered ? 'anim-fade-in-up delay-8' : ''}`}
            onClick={handleStart}
            disabled={verifyState === VERIFY_STATES.CHECKING}
            style={{
              marginTop: '4px',
              fontSize: 'clamp(0.85rem, 2.5vw, 1.2rem)',
              padding: '16px 40px',
              opacity: verifyState === VERIFY_STATES.CHECKING ? 0.5 : 1,
            }}
          >
            {verifyState === VERIFY_STATES.CHECKING ? 'VERIFYING...' : '\u{1F680} ACCEPT MISSION'}
          </button>
        )}
      </div>

      {/* Parent escape hatch */}
      <p
        onClick={handleSkipTap}
        style={{
          position: 'absolute',
          bottom: '12px',
          color: '#ffffff22',
          fontSize: '0.55rem',
          cursor: 'default',
          userSelect: 'none',
          zIndex: 2,
        }}
      >
        Parents: tap here 3 times
      </p>

      <style>{`
        @keyframes laserBeamShoot {
          0% { left: -25%; opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { left: 125%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  background: '#0a0a1a',
  border: '1px solid #00FFFF44',
  borderRadius: '4px',
  padding: '10px 12px',
  color: '#ffffff',
  fontFamily: 'var(--font-body)',
  fontSize: 'clamp(0.8rem, 2vw, 1rem)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

function StarField() {
  const [stars] = useState(() =>
    Array.from({ length: 80 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    }))
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
      {stars.map((star, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 0 4px #fff, 0 0 8px #ffffff88',
            animation: `neonPulse ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
