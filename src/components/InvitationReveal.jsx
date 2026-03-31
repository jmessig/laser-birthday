import { useState, useEffect, useRef } from 'react';
import { PARTY_CONFIG } from '../config';
import { playUnlock, playVictory, playPowerUp, playClick } from '../audio';
import { getGlobalParticles } from './ParticleOverlay';
import { confetti, sparkle, burstExplosion } from '../particles';

const PHASES = { DECRYPT: 0, STAMP: 1, REVEAL: 2 };

export default function InvitationReveal({ agentName }) {
  const [phase, setPhase] = useState(PHASES.DECRYPT);
  const [progress, setProgress] = useState(0);
  const [scrambleText, setScrambleText] = useState('');
  const [showStamp, setShowStamp] = useState(false);
  const [revealLines, setRevealLines] = useState(0);
  const [shake, setShake] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const confettiRef = useRef(null);

  // Phase 1: Decrypt progress bar
  useEffect(() => {
    if (phase !== PHASES.DECRYPT) return;
    playUnlock();

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const scrambleInterval = setInterval(() => {
      setScrambleText(
        Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      );
    }, 50);

    let p = 0;
    const progressInterval = setInterval(() => {
      p += 2 + Math.random() * 3;
      if (p >= 100) {
        p = 100;
        clearInterval(progressInterval);
        clearInterval(scrambleInterval);
        setTimeout(() => setPhase(PHASES.STAMP), 300);
      }
      setProgress(Math.min(100, Math.floor(p)));
    }, 80);

    return () => {
      clearInterval(progressInterval);
      clearInterval(scrambleInterval);
    };
  }, [phase]);

  // Phase 2: ACCESS GRANTED stamp
  useEffect(() => {
    if (phase !== PHASES.STAMP) return;

    // Flash white then stamp
    setTimeout(() => {
      setShowStamp(true);
      setShake(true);
      playPowerUp();

      // Screen shake
      setTimeout(() => setShake(false), 500);

      // Particles
      const ps = getGlobalParticles();
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      ps.addMany(burstExplosion(cx, cy, '#FFD700', 30));

      // Transition to reveal
      setTimeout(() => {
        playVictory();
        setPhase(PHASES.REVEAL);
      }, 1800);
    }, 200);
  }, [phase]);

  // Phase 3: Reveal invitation lines one by one
  useEffect(() => {
    if (phase !== PHASES.REVEAL) return;

    const totalLines = 14;
    let line = 0;
    const interval = setInterval(() => {
      line++;
      setRevealLines(line);
      if (line >= totalLines) {
        clearInterval(interval);
      }
    }, 250);

    // Continuous confetti
    confettiRef.current = setInterval(() => {
      const ps = getGlobalParticles();
      ps.addMany(confetti(window.innerWidth, window.innerHeight));
    }, 1500);

    // Initial burst
    const ps = getGlobalParticles();
    ps.addMany(confetti(window.innerWidth, window.innerHeight));
    ps.addMany(sparkle(window.innerWidth / 2, window.innerHeight / 2, 20));

    return () => {
      clearInterval(confettiRef.current);
    };
  }, [phase]);

  // Card tilt effect on mouse move
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltX(y * -8);
    setTiltY(x * 8);
  };

  const handleMouseLeave = () => {
    setTiltX(0);
    setTiltY(0);
  };

  const name = agentName || 'Agent';
  const c = PARTY_CONFIG;

  return (
    <div className={`screen ${shake ? 'anim-shake' : ''}`} style={{ background: 'var(--bg-deep)', overflowY: 'auto' }}>
      <div className="grid-floor" />

      {/* Phase: Decrypting */}
      {phase === PHASES.DECRYPT && (
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
        }}>
          <h2 className="text-glow-cyan anim-flicker" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(0.8rem, 2.5vw, 1.2rem)',
            letterSpacing: '3px',
          }}>
            DECRYPTING TOP SECRET FILE...
          </h2>

          {/* Scramble text */}
          <p style={{
            fontFamily: 'monospace',
            color: '#39FF1466',
            fontSize: '0.8rem',
            letterSpacing: '2px',
          }}>
            {scrambleText}
          </p>

          {/* Progress bar */}
          <div style={{
            width: 'min(300px, 80vw)',
            height: '16px',
            background: '#ffffff10',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #00FFFF44',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--electric-cyan), var(--neon-green))',
              borderRadius: '8px',
              boxShadow: '0 0 10px var(--electric-cyan)',
              transition: 'width 0.1s linear',
            }} />
          </div>
          <span className="font-arcade" style={{
            color: 'var(--neon-green)',
            textShadow: 'var(--glow-green)',
            fontSize: 'clamp(0.5rem, 1.5vw, 0.7rem)',
          }}>
            {progress}%
          </span>
        </div>
      )}

      {/* Phase: ACCESS GRANTED Stamp */}
      {phase === PHASES.STAMP && (
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {showStamp && (
            <div style={{
              animation: 'stampSlam 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              fontWeight: 900,
              color: 'var(--neon-green)',
              textShadow: '0 0 20px #39FF14, 0 0 40px #39FF14, 0 0 60px #39FF14',
              border: '4px solid var(--neon-green)',
              padding: '16px 32px',
              letterSpacing: '4px',
              transform: 'rotate(-5deg)',
              boxShadow: 'var(--glow-green)',
            }}>
              ACCESS GRANTED
            </div>
          )}
        </div>
      )}

      {/* Phase: Invitation Card */}
      {phase === PHASES.REVEAL && (
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="anim-scale-in"
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 'min(500px, 90vw)',
            width: '100%',
            margin: '20px',
            padding: 'clamp(20px, 4vw, 36px)',
            background: '#0d0d24ee',
            border: '2px solid transparent',
            borderRadius: '16px',
            animation: 'scaleIn 0.6s ease-out forwards, borderGlowCycle 4s linear infinite',
            transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            transition: 'transform 0.1s ease-out',
            overflowY: 'auto',
            maxHeight: 'calc(100dvh - 40px)',
          }}
        >
          {/* TOP SECRET watermark */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 10vw, 4rem)',
            color: '#FF073A08',
            fontWeight: 900,
            letterSpacing: '8px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            TOP SECRET
          </div>

          {/* Invitation content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1.5vh, 12px)',
            textAlign: 'center',
            position: 'relative',
          }}>
            <InvLine show={revealLines >= 1}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                <img
                  src="/colton.png"
                  alt="Colton"
                  style={{
                    width: 'clamp(80px, 20vw, 120px)',
                    height: 'clamp(80px, 20vw, 120px)',
                    borderRadius: '50%',
                    border: '3px solid var(--neon-green)',
                    boxShadow: '0 0 15px #39FF1466, 0 0 30px #39FF1422',
                    objectFit: 'cover',
                  }}
                />
              </div>
              <span className="anim-rainbow" style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(0.8rem, 2.5vw, 1.2rem)',
                fontWeight: 800,
                letterSpacing: '2px',
              }}>
                {'\u{1F3AF}'} MISSION BRIEFING: BIRTHDAY PARTY! {'\u{1F3AF}'}
              </span>
            </InvLine>

            <InvLine show={revealLines >= 2}>
              <p style={{ color: 'var(--electric-cyan)', textShadow: 'var(--glow-cyan)', fontFamily: 'var(--font-body)', fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>
                Agent {name}, you have proven yourself worthy!
              </p>
            </InvLine>

            <InvLine show={revealLines >= 3}>
              <p style={{ color: '#ffffff99', fontFamily: 'var(--font-body)', fontSize: 'clamp(0.7rem, 1.8vw, 0.9rem)' }}>
                You are hereby invited to join the ultimate mission:
              </p>
            </InvLine>

            <InvLine show={revealLines >= 4}>
              <div style={{ margin: '4px 0' }}>
                <span className="text-glow-magenta" style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(0.9rem, 3vw, 1.4rem)',
                  fontWeight: 800,
                }}>
                  {'\u{1F382}'} {c.birthdayKidName}'s {c.kidAge}th Birthday Party! {'\u{1F382}'}
                </span>
              </div>
            </InvLine>

            <div style={{
              background: '#ffffff08',
              borderRadius: '8px',
              padding: 'clamp(10px, 2vw, 16px)',
              margin: '4px 0',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <InvLine show={revealLines >= 5}>
                <Detail icon={'\u{1F4C5}'} label="DATE" value={c.partyDate} />
              </InvLine>
              <InvLine show={revealLines >= 6}>
                <Detail icon={'\u{1F550}'} label="TIME" value={`${c.partyTimeStart} \u2013 ${c.partyTimeEnd}`} />
              </InvLine>
              <InvLine show={revealLines >= 7}>
                <Detail icon={'\u{1F4CD}'} label="LOCATION" value={c.venueName} />
              </InvLine>
              <InvLine show={revealLines >= 8}>
                <Detail icon={'\u{1F4CD}'} label="ADDRESS" value={c.venueAddress} />
              </InvLine>
            </div>

            <InvLine show={revealLines >= 9}>
              <p style={{
                color: 'var(--warm-gold)',
                textShadow: 'var(--glow-gold)',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(0.65rem, 1.8vw, 0.9rem)',
                letterSpacing: '1px',
              }}>
                {'\u26A1'} {c.missionDetails} {'\u26A1'}
              </p>
            </InvLine>

            <div style={{
              background: '#ffffff08',
              borderRadius: '8px',
              padding: 'clamp(10px, 2vw, 16px)',
              margin: '4px 0',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <InvLine show={revealLines >= 10}>
                <Detail icon={'\u{1F464}'} label="RSVP TO" value={c.rsvpName} />
              </InvLine>
              <InvLine show={revealLines >= 11}>
                <Detail icon={'\u{1F4F1}'} label="CALL/TEXT" value={c.rsvpPhone} link={`tel:${c.rsvpPhone}`} />
              </InvLine>
              <InvLine show={revealLines >= 12}>
                <Detail icon={'\u{1F4E7}'} label="EMAIL" value={c.rsvpEmail} link={`mailto:${c.rsvpEmail}`} />
              </InvLine>
              <InvLine show={revealLines >= 13}>
                <Detail icon={'\u23F0'} label="RSVP BY" value={c.rsvpDeadline} />
              </InvLine>
            </div>

            <InvLine show={revealLines >= 14}>
              <p style={{
                color: 'var(--electric-cyan)',
                textShadow: 'var(--glow-cyan)',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(0.65rem, 1.8vw, 0.9rem)',
                fontStyle: 'italic',
                marginTop: '4px',
              }}>
                "See you on the battlefield, Agent!"
              </p>
            </InvLine>

            {/* RSVP Buttons */}
            {revealLines >= 14 && (
              <div className="anim-fade-in-up delay-3" style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                marginTop: '12px',
                flexWrap: 'wrap',
              }}>
                <a
                  href={`sms:${c.rsvpPhone}`}
                  className="btn-neon"
                  style={{ textDecoration: 'none', fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)', padding: '10px 20px' }}
                >
                  {'\u{1F4F1}'} TEXT RSVP
                </a>
                <a
                  href={`mailto:${c.rsvpEmail}?subject=RSVP%20-%20${encodeURIComponent(c.birthdayKidName)}%27s%20Birthday`}
                  className="btn-neon btn-neon-cyan"
                  style={{ textDecoration: 'none', fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)', padding: '10px 20px' }}
                >
                  {'\u{1F4E7}'} EMAIL RSVP
                </a>
              </div>
            )}

            {/* Email me a copy */}
            {revealLines >= 14 && (
              <EmailCopyForm agentName={name} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function InvLine({ show, children }) {
  if (!show) return null;
  return (
    <div className="anim-fade-in-up" style={{ width: '100%' }}>
      {children}
    </div>
  );
}

function Detail({ icon, label, value, link }) {
  const content = (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontSize: 'clamp(0.65rem, 1.7vw, 0.85rem)',
    }}>
      <span>{icon}</span>
      <span>
        <span style={{
          color: '#ffffff55',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.5rem, 1.2vw, 0.65rem)',
          letterSpacing: '1px',
        }}>
          {label}:
        </span>{' '}
        <span style={{ color: '#ffffffcc' }}>{value}</span>
      </span>
    </div>
  );

  if (link) {
    return (
      <a href={link} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </a>
    );
  }
  return content;
}

function EmailCopyForm({ agentName }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, sent, error

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    playClick();
    try {
      const res = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, agentName }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('sent');
        playPowerUp();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="anim-fade-in-up" style={{
        marginTop: '12px',
        padding: '12px',
        background: '#39FF140a',
        border: '1px solid #39FF1444',
        borderRadius: '8px',
        textAlign: 'center',
      }}>
        <p style={{
          color: 'var(--neon-green)',
          textShadow: 'var(--glow-green)',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.55rem, 1.5vw, 0.75rem)',
          letterSpacing: '2px',
        }}>
          {'\u2705'} INVITATION SENT TO YOUR EMAIL!
        </p>
      </div>
    );
  }

  return (
    <div className="anim-fade-in-up delay-5" style={{
      marginTop: '12px',
      padding: '14px',
      background: '#ffffff06',
      border: '1px solid #ffffff10',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'center',
    }}>
      <p style={{
        color: '#ffffff66',
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(0.5rem, 1.3vw, 0.65rem)',
        letterSpacing: '2px',
      }}>
        {'\u{1F4E8}'} EMAIL ME A COPY
      </p>
      <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="your@email.com"
          style={{
            background: '#0a0a1a',
            border: '1px solid #00FFFF33',
            borderRadius: '4px',
            padding: '8px 12px',
            color: '#ffffff',
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(0.7rem, 1.8vw, 0.85rem)',
            outline: 'none',
            flex: '1 1 180px',
            minWidth: '0',
          }}
        />
        <button
          onClick={handleSend}
          disabled={status === 'sending'}
          className="btn-neon btn-neon-magenta"
          style={{
            fontSize: 'clamp(0.55rem, 1.3vw, 0.7rem)',
            padding: '8px 16px',
            opacity: status === 'sending' ? 0.5 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'sending' ? 'SENDING...' : 'SEND'}
        </button>
      </div>
      {status === 'error' && (
        <p style={{
          color: 'var(--laser-red)',
          fontSize: 'clamp(0.5rem, 1.2vw, 0.65rem)',
          fontFamily: 'var(--font-display)',
        }}>
          Failed to send — check your email address
        </p>
      )}
    </div>
  );
}
