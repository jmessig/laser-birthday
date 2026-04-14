import { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_CONFIG } from '../config';
import { playLaserSound, playExplosion, playCountdown, playCountdownGo, playVictory, playMiss, playPowerUp } from '../audio';
import { ParticleSystem, burstExplosion, laserTrail } from '../particles';

const STATES = { COUNTDOWN: 0, PLAYING: 1, WIN: 2, FAIL: 3 };

export default function TargetPractice({ onComplete, onBack }) {
  const [gameKey, setGameKey] = useState(0);
  const [failCount, setFailCount] = useState(0);

  const handleRetry = () => {
    setGameKey(k => k + 1); // full remount of game
  };

  const handleAutoPass = () => {
    playPowerUp();
    onComplete();
  };

  return (
    <TargetPracticeGame
      key={gameKey}
      onComplete={onComplete}
      onBack={onBack}
      failCount={failCount}
      onFail={() => setFailCount(f => f + 1)}
      onRetry={handleRetry}
      onAutoPass={handleAutoPass}
    />
  );
}

function TargetPracticeGame({ onComplete, onBack, failCount, onFail, onRetry, onAutoPass }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    gameState: STATES.COUNTDOWN,
    countdown: 3,
    timeLeft: GAME_CONFIG.targetPracticeDuration,
    score: 0,
    targets: [],
    floatingTexts: [],
    laserBeam: null,
    flashColor: null,
    particles: new ParticleSystem(),
    lastTime: 0,
    spawnTimer: 0,
    mouseX: 0,
    mouseY: 0,
  });
  const [gameState, setGameState] = useState(STATES.COUNTDOWN);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.targetPracticeDuration);
  const animRef = useRef(null);

  const getCanvasSize = useCallback(() => {
    const w = Math.min(600, window.innerWidth - 20);
    const h = Math.min(600, window.innerHeight - 180);
    return { w, h };
  }, []);

  const spawnTarget = useCallback((w, h) => {
    const padding = 50;
    return {
      x: padding + Math.random() * (w - padding * 2),
      y: padding + Math.random() * (h - padding * 2),
      radius: 28 + Math.random() * 12,
      life: GAME_CONFIG.targetVisibleTime[0] + Math.random() * (GAME_CONFIG.targetVisibleTime[1] - GAME_CONFIG.targetVisibleTime[0]),
      maxLife: 0,
      pulse: 0,
      hit: false,
    };
  }, []);

  // Main game loop — runs once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { w, h } = getCanvasSize();
    canvas.width = w;
    canvas.height = h;

    const s = stateRef.current;
    s.lastTime = performance.now();
    let stopped = false;

    // Countdown
    let countdownTimer = 0;
    playCountdown();
    const cdInterval = setInterval(() => {
      countdownTimer++;
      if (countdownTimer < 3) {
        playCountdown();
        s.countdown = 3 - countdownTimer;
      } else {
        playCountdownGo();
        s.gameState = STATES.PLAYING;
        s.countdown = 0;
        setGameState(STATES.PLAYING);
        clearInterval(cdInterval);
      }
    }, 1000);

    const loop = (now) => {
      if (stopped) return;
      const dt = Math.min((now - s.lastTime) / 1000, 0.1); // cap dt
      s.lastTime = now;

      ctx.clearRect(0, 0, w, h);
      drawGrid(ctx, w, h);

      if (s.gameState === STATES.COUNTDOWN) {
        ctx.font = `bold ${Math.min(w, h) * 0.3}px 'Orbitron', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#39FF14';
        ctx.shadowColor = '#39FF14';
        ctx.shadowBlur = 30;
        ctx.fillText(s.countdown > 0 ? s.countdown : 'GO!', w / 2, h / 2);
        ctx.shadowBlur = 0;
      } else if (s.gameState === STATES.PLAYING) {
        // Time
        s.timeLeft -= dt;
        if (s.timeLeft <= 0) {
          s.timeLeft = 0;
          s.gameState = s.score >= GAME_CONFIG.targetHitsToWin ? STATES.WIN : STATES.FAIL;
          setTimeLeft(0);
          if (s.gameState === STATES.WIN) {
            playVictory();
          } else {
            onFail();
          }
          setGameState(s.gameState);
          // Don't return — let particles render one more frame
        } else {
          setTimeLeft(Math.ceil(s.timeLeft));
        }

        // Spawn targets
        s.spawnTimer -= dt * 1000;
        const activeTargets = s.targets.filter(t => !t.hit);
        const [minDelay, maxDelay] = GAME_CONFIG.targetSpawnDelay;
        if (s.spawnTimer <= 0 && activeTargets.length < GAME_CONFIG.maxVisibleTargets && s.timeLeft > 0) {
          s.targets.push(spawnTarget(w, h));
          s.spawnTimer = minDelay + Math.random() * (maxDelay - minDelay);
        }

        // Update & draw targets
        s.targets = s.targets.filter(t => {
          if (t.hit) return false;
          t.maxLife += dt * 1000;
          t.pulse += dt * 6;
          if (t.maxLife >= t.life) return false;

          const alpha = 1 - (t.maxLife / t.life) * 0.3;
          const pulseR = t.radius + Math.sin(t.pulse) * 3;

          ctx.beginPath();
          ctx.arc(t.x, t.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 7, 58, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.shadowColor = '#FF073A';
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.beginPath();
          ctx.arc(t.x, t.y, pulseR * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 165, 0, ${alpha * 0.8})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(t.x, t.y, pulseR * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 7, 58, ${alpha})`;
          ctx.shadowColor = '#FF073A';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;

          return true;
        });

        // Laser beam
        if (s.laserBeam) {
          const lb = s.laserBeam;
          lb.life -= dt * 4;
          if (lb.life > 0) {
            ctx.beginPath();
            ctx.moveTo(w / 2, h);
            ctx.lineTo(lb.x, lb.y);
            ctx.strokeStyle = `rgba(57, 255, 20, ${lb.life})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = '#39FF14';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            s.laserBeam = null;
          }
        }

        // Floating texts
        s.floatingTexts = s.floatingTexts.filter(ft => {
          ft.y -= 40 * dt;
          ft.life -= dt * 1.5;
          if (ft.life <= 0) return false;
          ctx.font = `bold 16px 'Press Start 2P', monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(57, 255, 20, ${ft.life})`;
          ctx.shadowColor = '#39FF14';
          ctx.shadowBlur = 8;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.shadowBlur = 0;
          return true;
        });

        // Flash effect
        if (s.flashColor) {
          s.flashColor.life -= dt * 5;
          if (s.flashColor.life > 0) {
            ctx.fillStyle = `rgba(255, 7, 58, ${s.flashColor.life * 0.3})`;
            ctx.fillRect(0, 0, w, h);
          } else {
            s.flashColor = null;
          }
        }

        // Crosshair
        drawCrosshair(ctx, s.mouseX, s.mouseY);
      }
      // WIN/FAIL: just keep rendering particles on the grid, overlay handles the rest

      // Particles always
      s.particles.update();
      s.particles.draw(ctx);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      stopped = true;
      clearInterval(cdInterval);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [getCanvasSize, spawnTarget, onFail]);

  // Click handler
  const handleCanvasClick = useCallback((e) => {
    const s = stateRef.current;
    if (s.gameState !== STATES.PLAYING) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    s.laserBeam = { x, y, life: 1 };
    s.particles.addMany(laserTrail(canvas.width / 2, canvas.height, x, y, '#39FF14'));

    let hit = false;
    for (const t of s.targets) {
      if (t.hit) continue;
      const dist = Math.hypot(t.x - x, t.y - y);
      if (dist < t.radius * 1.3) {
        t.hit = true;
        hit = true;
        s.score++;
        setScore(s.score);
        playLaserSound();
        playExplosion();
        s.particles.addMany(burstExplosion(t.x, t.y, '#FF073A', 15));
        s.floatingTexts.push({ x: t.x, y: t.y - 20, text: '+1', life: 1 });
        // Early win when target hit count reached
        if (s.score >= GAME_CONFIG.targetHitsToWin) {
          s.gameState = STATES.WIN;
          playVictory();
          setGameState(STATES.WIN);
        }
        break;
      }
    }

    if (!hit) {
      playMiss();
      s.flashColor = { color: 'rgb(255, 7, 58)', life: 1 };
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    stateRef.current.mouseX = (e.clientX - rect.left) * scaleX;
    stateRef.current.mouseY = (e.clientY - rect.top) * scaleY;
  }, []);

  const { w, h } = getCanvasSize();

  return (
    <div className="screen" style={{ background: 'var(--bg-deep)', gap: '8px', padding: '10px' }}>
      {/* HUD */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: `min(${w}px, calc(100vw - 20px))`,
        zIndex: 2,
        padding: '0 4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TimerRing timeLeft={timeLeft} total={GAME_CONFIG.targetPracticeDuration} />
          <span className="font-arcade" style={{
            color: timeLeft <= 10 ? 'var(--laser-red)' : 'var(--electric-cyan)',
            textShadow: timeLeft <= 10 ? 'var(--glow-red)' : 'var(--glow-cyan)',
            fontSize: 'clamp(0.6rem, 2vw, 0.9rem)',
          }}>
            {timeLeft}s
          </span>
        </div>
        <span className="font-arcade" style={{
          color: score >= GAME_CONFIG.targetHitsToWin ? 'var(--neon-green)' : 'var(--warm-gold)',
          textShadow: score >= GAME_CONFIG.targetHitsToWin ? 'var(--glow-green)' : 'var(--glow-gold)',
          fontSize: 'clamp(0.6rem, 2vw, 0.9rem)',
        }}>
          {score} / {GAME_CONFIG.targetHitsToWin} {'\u{1F3AF}'}
        </span>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleCanvasClick({ clientX: touch.clientX, clientY: touch.clientY });
        }}
        style={{
          width: `min(${w}px, calc(100vw - 20px))`,
          height: `min(${h}px, calc(100vh - 180px))`,
          borderRadius: '8px',
          border: '1px solid #39FF1433',
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      />

      {/* Instruction */}
      {gameState === STATES.PLAYING && (
        <p className="anim-fade-in-up" style={{
          color: '#ffffff44',
          fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '2px',
        }}>
          TAP THE TARGETS!
        </p>
      )}

      {/* Win Screen */}
      {gameState === STATES.WIN && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a1aee',
          zIndex: 10,
          gap: '16px',
          animation: 'fadeInUp 0.5s ease-out forwards',
        }}>
          <h2 className="title-lg anim-rainbow" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
          }}>
            MISSION COMPLETE!
          </h2>
          <div style={{ fontSize: '2rem' }}>
            {'\u2B50'}{'\u2B50'}{'\u2B50'}
          </div>
          <p className="font-arcade text-glow-green" style={{
            fontSize: 'clamp(0.7rem, 2vw, 1rem)',
          }}>
            Score: {score}
          </p>
          <button className="btn-neon" onClick={onComplete}>
            RETURN TO HQ
          </button>
        </div>
      )}

      {/* Fail Screen */}
      {gameState === STATES.FAIL && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a1aee',
          zIndex: 10,
          gap: '16px',
          animation: 'fadeInUp 0.5s ease-out forwards',
        }}>
          <h2 className="title-lg text-glow-cyan" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
          }}>
            TRY AGAIN, AGENT!
          </h2>
          <p style={{ color: '#ffffff88', fontSize: 'clamp(0.7rem, 2vw, 0.9rem)' }}>
            You got {score} / {GAME_CONFIG.targetHitsToWin} targets
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn-neon btn-neon-cyan" onClick={onRetry}>
              RETRY MISSION
            </button>
            {failCount >= GAME_CONFIG.autoPassAfterFailures && (
              <button className="btn-neon" onClick={onAutoPass} style={{ animation: 'pulseScale 1s ease-in-out infinite' }}>
                FIELD PROMOTION!
              </button>
            )}
          </div>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff44',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-display)',
            }}
          >
            Back to HQ
          </button>
        </div>
      )}
    </div>
  );
}

function TimerRing({ timeLeft, total }) {
  const pct = timeLeft / total;
  const r = 16;
  const circ = 2 * Math.PI * r;
  const color = timeLeft <= 10 ? 'var(--laser-red)' : 'var(--electric-cyan)';

  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#ffffff15" strokeWidth="3" />
      <circle
        cx="20" cy="20" r={r} fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        style={{
          filter: `drop-shadow(0 0 4px ${color})`,
          transition: 'stroke-dashoffset 0.3s linear',
        }}
      />
    </svg>
  );
}

function drawGrid(ctx, w, h) {
  ctx.strokeStyle = '#39FF1410';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawCrosshair(ctx, x, y) {
  if (x === 0 && y === 0) return;
  ctx.strokeStyle = '#39FF14aa';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#39FF14';
  ctx.shadowBlur = 5;
  const size = 14;
  ctx.beginPath();
  ctx.moveTo(x - size, y); ctx.lineTo(x - 5, y);
  ctx.moveTo(x + 5, y); ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size); ctx.lineTo(x, y - 5);
  ctx.moveTo(x, y + 5); ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}
