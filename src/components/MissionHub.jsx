import { useState, useEffect } from 'react';
import { playClick, playVictory, playPowerUp } from '../audio';
import { getGlobalParticles } from './ParticleOverlay';
import { burstExplosion, sparkle } from '../particles';

const MISSION_DATA = [
  { num: '01', name: 'TARGET PRACTICE', icon: '\u{1F3AF}', desc: 'Laser Target Shooting' },
  { num: '02', name: 'CODE CRACKER', icon: '\u{1F510}', desc: 'Pattern Memory Puzzle' },
  { num: '03', name: 'LASER MAZE', icon: '\u26A1', desc: 'Maze Navigation' },
];

export default function MissionHub({ missions, agentName, onSelectMission, onDecrypt }) {
  const [entered, setEntered] = useState(false);
  const [showDecrypt, setShowDecrypt] = useState(false);
  const completedCount = missions.filter(Boolean).length;
  const allComplete = completedCount === 3;

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Show decrypt button when all missions are done
  useEffect(() => {
    if (allComplete && !showDecrypt) {
      const t = setTimeout(() => {
        setShowDecrypt(true);
        playVictory();
        try {
          const ps = getGlobalParticles();
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight * 0.75;
          ps.addMany(burstExplosion(cx, cy, '#FFD700', 30));
          ps.addMany(sparkle(cx, cy, 20));
        } catch (e) { /* particles are optional */ }
      }, 600);
      return () => clearTimeout(t);
    }
  }, [allComplete, showDecrypt]);

  const getStatus = (index) => {
    if (missions[index]) return 'COMPLETE';
    if (index === 0 || missions[index - 1]) return 'READY';
    return 'LOCKED';
  };

  const handleCardClick = (index) => {
    const status = getStatus(index);
    if (status === 'READY') {
      playClick();
      onSelectMission(index);
    }
  };

  return (
    <div className="screen" style={{
      background: 'var(--bg-deep)',
      overflowY: 'auto',
      justifyContent: 'flex-start',
      paddingTop: 'clamp(20px, 5vh, 60px)',
    }}>
      <div className="grid-floor" />

      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'clamp(14px, 2.5vh, 24px)',
        padding: '16px 20px 40px',
        width: '100%',
        maxWidth: '900px',
      }}>
        {/* Header */}
        <h2
          className={`title-lg text-glow-cyan ${entered ? 'anim-fade-in-up' : ''}`}
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '3px', margin: 0 }}
        >
          MISSION SELECT HQ
        </h2>
        <p
          className={`text-md ${entered ? 'anim-fade-in-up delay-1' : ''}`}
          style={{ color: '#ffffff88', fontFamily: 'var(--font-display)', letterSpacing: '2px' }}
        >
          Welcome, Agent {agentName}
        </p>

        {/* Subtext */}
        <p className={`text-sm ${entered ? 'anim-fade-in-up delay-2' : ''}`} style={{
          color: '#ffffff44',
          fontFamily: 'var(--font-body)',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          Complete all missions to decrypt your secret party invitation
        </p>

        {/* Mission Cards */}
        <div style={{
          display: 'flex',
          gap: 'clamp(10px, 2vw, 20px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          width: '100%',
        }}>
          {MISSION_DATA.map((mission, i) => {
            const status = getStatus(i);
            return (
              <MissionCard
                key={i}
                mission={mission}
                status={status}
                onClick={() => handleCardClick(i)}
                entered={entered}
                delay={i + 3}
              />
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className={entered ? 'anim-fade-in-up delay-7' : ''} style={{
          width: 'min(400px, 85vw)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
            letterSpacing: '2px',
          }}>
            <span style={{ color: 'var(--electric-cyan)', textShadow: 'var(--glow-cyan)' }}>
              MISSION STATUS
            </span>
            <span className="font-arcade" style={{
              color: allComplete ? 'var(--warm-gold)' : 'var(--neon-green)',
              textShadow: allComplete ? 'var(--glow-gold)' : 'var(--glow-green)',
              fontSize: 'clamp(0.5rem, 1.2vw, 0.7rem)',
            }}>
              {completedCount}/3
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '14px',
            background: '#ffffff10',
            borderRadius: '7px',
            overflow: 'hidden',
            border: `1px solid ${allComplete ? '#FFD70044' : '#39FF1444'}`,
          }}>
            <div style={{
              width: `${(completedCount / 3) * 100}%`,
              height: '100%',
              background: allComplete
                ? 'linear-gradient(90deg, var(--warm-gold), var(--hot-magenta), var(--warm-gold))'
                : 'linear-gradient(90deg, var(--neon-green), var(--electric-cyan))',
              backgroundSize: allComplete ? '200% 100%' : '100% 100%',
              animation: allComplete ? 'gradientShift 2s linear infinite' : 'none',
              borderRadius: '7px',
              boxShadow: allComplete
                ? '0 0 15px var(--warm-gold), 0 0 30px var(--warm-gold)'
                : '0 0 10px var(--neon-green), 0 0 20px var(--neon-green)',
              transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }} />
          </div>
        </div>

        {/* ALL MISSIONS COMPLETE message + Decrypt Button */}
        {allComplete && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            animation: 'fadeInUp 0.6s ease-out forwards',
          }}>
            <p className="text-glow-gold" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(0.7rem, 2vw, 1rem)',
              letterSpacing: '3px',
              textAlign: 'center',
            }}>
              ALL MISSIONS COMPLETE!
            </p>

            {showDecrypt && (
              <button
                className="btn-neon btn-mega"
                onClick={() => {
                  playPowerUp();
                  onDecrypt();
                }}
                style={{
                  borderColor: 'var(--warm-gold)',
                  color: 'var(--warm-gold)',
                  animation: 'fadeInUp 0.5s ease-out forwards, pulseScale 1.5s ease-in-out infinite, borderGlowCycle 3s linear infinite',
                }}
              >
                {'\u{1F512}'} DECRYPT INVITATION {'\u{1F512}'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MissionCard({ mission, status, onClick, entered, delay }) {
  const isLocked = status === 'LOCKED';
  const isComplete = status === 'COMPLETE';
  const isReady = status === 'READY';

  return (
    <div
      className={entered ? `anim-fade-in-up delay-${delay}` : ''}
      onClick={onClick}
      style={{
        width: 'min(240px, 42vw)',
        padding: 'clamp(14px, 2.5vw, 24px)',
        background: isComplete ? '#39FF140a' : '#0d0d24cc',
        border: `2px solid ${
          isComplete ? '#39FF14' : isReady ? '#00FFFF' : '#ffffff15'
        }`,
        borderRadius: '12px',
        cursor: isReady ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isComplete
          ? 'var(--glow-green)'
          : isReady
          ? '0 0 8px #00FFFF44'
          : 'none',
        opacity: isLocked ? 0.5 : 1,
        filter: isLocked ? 'grayscale(0.5)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        textAlign: 'center',
      }}
      onMouseEnter={(e) => {
        if (isReady) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 0 15px #00FFFF, 0 0 30px #00FFFF66';
        }
      }}
      onMouseLeave={(e) => {
        if (isReady) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 8px #00FFFF44';
        }
      }}
    >
      {isLocked && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #ffffff05 3px)',
          pointerEvents: 'none',
        }} />
      )}

      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(0.5rem, 1.3vw, 0.65rem)',
        color: '#ffffff66',
        letterSpacing: '3px',
      }}>
        MISSION {mission.num}
      </span>

      <span style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
        {mission.icon}
      </span>

      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(0.6rem, 1.6vw, 0.85rem)',
        fontWeight: 700,
        color: isComplete ? 'var(--neon-green)' : isReady ? 'var(--electric-cyan)' : '#ffffff66',
        textShadow: isComplete ? 'var(--glow-green)' : isReady ? 'var(--glow-cyan)' : 'none',
        letterSpacing: '1px',
      }}>
        {mission.name}
      </span>

      <span style={{
        fontFamily: 'var(--font-arcade)',
        fontSize: 'clamp(0.4rem, 1vw, 0.55rem)',
        padding: '4px 10px',
        borderRadius: '4px',
        background: isComplete ? '#39FF1420' : isReady ? '#00FFFF15' : '#ffffff08',
        color: isComplete ? 'var(--neon-green)' : isReady ? 'var(--electric-cyan)' : '#ffffff44',
        border: `1px solid ${isComplete ? '#39FF1444' : isReady ? '#00FFFF44' : '#ffffff11'}`,
      }}>
        {isComplete ? '\u2705 COMPLETE' : isReady ? '\u25B6\uFE0F READY' : '\u{1F512} LOCKED'}
      </span>

      {isComplete && (
        <div className="anim-neon-pulse" style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid #39FF1444',
          borderRadius: '12px',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}
