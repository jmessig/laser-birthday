import { useState, useEffect, useRef, useCallback } from 'react';
import { playClick, playError, playPowerUp, playVictory, playLaserSound } from '../audio';
import { ParticleSystem, burstExplosion, vortex, sparkle } from '../particles';

// 12x12 maze — more complex with multiple paths and dead ends
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,0,1,0,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,1],
  [1,1,1,0,1,0,1,1,1,0,1,1],
  [1,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
];

const START = { x: 1, y: 1 };
const EXIT = { x: 9, y: 10 };
const CHECKPOINTS = [
  { x: 5, y: 3 },
  { x: 1, y: 7 },
  { x: 9, y: 7 },
];

// More laser beams for a real challenge
const LASERS = [
  // Horizontal beams
  { x1: 1, y1: 5, x2: 4, y2: 5, horizontal: true, phase: 0 },
  { x1: 7, y1: 3, x2: 9, y2: 3, horizontal: true, phase: 0.4 },
  { x1: 3, y1: 7, x2: 5, y2: 7, horizontal: true, phase: 0.2 },
  { x1: 7, y1: 9, x2: 8, y2: 9, horizontal: true, phase: 0.6 },
  { x1: 1, y1: 9, x2: 4, y2: 9, horizontal: true, phase: 0.8 },
  // Vertical beams
  { x1: 5, y1: 1, x2: 5, y2: 3, horizontal: false, phase: 0.5 },
  { x1: 10, y1: 1, x2: 10, y2: 4, horizontal: false, phase: 0.3 },
  { x1: 3, y1: 5, x2: 3, y2: 7, horizontal: false, phase: 0.7 },
  { x1: 10, y1: 7, x2: 10, y2: 8, horizontal: false, phase: 0.1 },
  { x1: 7, y1: 5, x2: 7, y2: 7, horizontal: false, phase: 0.9 },
];

export default function LaserMaze({ onComplete, onBack }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    playerX: START.x,
    playerY: START.y,
    trail: [{ x: START.x, y: START.y }],
    respawnPoint: { ...START },
    activatedCheckpoints: new Set(),
    particles: new ParticleSystem(),
    laserTime: 0,
    hitCooldown: 0,
    won: false,
    portalAngle: 0,
  });
  const [won, setWon] = useState(false);
  const animRef = useRef(null);

  const getCellSize = useCallback(() => {
    const maxW = Math.min(540, window.innerWidth - 30);
    const maxH = Math.min(540, window.innerHeight - 230);
    return Math.floor(Math.min(maxW, maxH) / MAZE.length);
  }, []);

  const canMove = useCallback((x, y) => {
    if (x < 0 || y < 0 || x >= MAZE[0].length || y >= MAZE.length) return false;
    return MAZE[y][x] === 0;
  }, []);

  const move = useCallback((dx, dy) => {
    const s = stateRef.current;
    if (s.won || s.hitCooldown > 0) return;
    const nx = s.playerX + dx;
    const ny = s.playerY + dy;
    if (!canMove(nx, ny)) return;

    playClick();
    s.playerX = nx;
    s.playerY = ny;
    s.trail.push({ x: nx, y: ny });
    if (s.trail.length > 10) s.trail.shift();

    // Check checkpoints
    CHECKPOINTS.forEach((cp, i) => {
      if (cp.x === nx && cp.y === ny && !s.activatedCheckpoints.has(i)) {
        s.activatedCheckpoints.add(i);
        s.respawnPoint = { x: cp.x, y: cp.y };
        playPowerUp();
        const cs = getCellSize();
        s.particles.addMany(sparkle(nx * cs + cs / 2, ny * cs + cs / 2, 15));
      }
    });

    // Check exit
    if (nx === EXIT.x && ny === EXIT.y) {
      s.won = true;
      setWon(true);
      playVictory();
    }
  }, [canMove, getCellSize]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': e.preventDefault(); move(0, -1); break;
        case 'ArrowDown': case 's': case 'S': e.preventDefault(); move(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); move(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); move(1, 0); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [move]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stopped = false;

    const loop = () => {
      if (stopped) return;
      const s = stateRef.current;
      const cs = getCellSize();
      const w = cs * MAZE[0].length;
      const h = cs * MAZE.length;
      canvas.width = w;
      canvas.height = h;
      s.laserTime += 1 / 60;
      s.portalAngle += 0.03;
      if (s.hitCooldown > 0) s.hitCooldown -= 1 / 60;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      // Draw maze walls with subtle gradient
      for (let y = 0; y < MAZE.length; y++) {
        for (let x = 0; x < MAZE[0].length; x++) {
          if (MAZE[y][x] === 1) {
            ctx.fillStyle = '#141438';
            ctx.fillRect(x * cs, y * cs, cs, cs);
            // Wall edge glow
            ctx.strokeStyle = '#00FFFF15';
            ctx.lineWidth = 1;
            ctx.strokeRect(x * cs + 0.5, y * cs + 0.5, cs - 1, cs - 1);
          } else {
            // Floor tile subtle pattern
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(x * cs, y * cs, cs, cs);
            ctx.strokeStyle = '#ffffff06';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x * cs, y * cs, cs, cs);
          }
        }
      }

      // Draw checkpoints
      CHECKPOINTS.forEach((cp, i) => {
        const cx = cp.x * cs + cs / 2;
        const cy = cp.y * cs + cs / 2;
        const activated = s.activatedCheckpoints.has(i);
        const r = cs * 0.3;
        const pulseSize = activated ? 0 : Math.sin(s.laserTime * 4) * 3;

        ctx.beginPath();
        ctx.arc(cx, cy, r + pulseSize, 0, Math.PI * 2);
        ctx.strokeStyle = activated ? '#FFD700' : '#39FF14';
        ctx.lineWidth = activated ? 3 : 2;
        ctx.shadowColor = activated ? '#FFD700' : '#39FF14';
        ctx.shadowBlur = activated ? 15 : 8;
        ctx.stroke();
        if (activated) {
          ctx.fillStyle = '#FFD70022';
          ctx.fill();
          // Inner checkmark
          ctx.fillStyle = '#FFD700';
          ctx.font = `bold ${cs * 0.35}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('\u2713', cx, cy);
        } else {
          // Pulsing ring inside
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
          ctx.strokeStyle = '#39FF1444';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      });

      // Draw exit portal
      const ex = EXIT.x * cs + cs / 2;
      const ey = EXIT.y * cs + cs / 2;
      for (let ring = 0; ring < 4; ring++) {
        ctx.beginPath();
        const r = cs * 0.4 - ring * 3;
        ctx.arc(ex, ey, r, s.portalAngle + ring * 0.7, s.portalAngle + ring * 0.7 + Math.PI * 1.5);
        ctx.strokeStyle = ring % 2 === 0 ? '#BF00FF' : '#00FFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = ring % 2 === 0 ? '#BF00FF' : '#00FFFF';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      // Portal center glow
      const portalGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, cs * 0.3);
      portalGrad.addColorStop(0, '#BF00FF33');
      portalGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = portalGrad;
      ctx.fillRect(ex - cs * 0.4, ey - cs * 0.4, cs * 0.8, cs * 0.8);

      // Draw & check lasers
      LASERS.forEach(laser => {
        const period = 3;
        const t = ((s.laserTime + laser.phase * period) % period) / period;
        const isOn = t < 0.5;
        const willBeOn = t > 0.88;

        if (isOn || willBeOn) {
          const color = willBeOn ? '#FFFF00' : '#FF073A';
          const alpha = willBeOn ? 0.25 + Math.sin(s.laserTime * 15) * 0.15 : 0.7 + Math.sin(s.laserTime * 20) * 0.2;
          const lineW = willBeOn ? 1 : 3;

          if (laser.horizontal) {
            for (let x = laser.x1; x <= laser.x2; x++) {
              if (MAZE[laser.y1][x] === 1) continue;
              const lx = x * cs + cs / 2;
              const ly = laser.y1 * cs + cs / 2;
              ctx.beginPath();
              ctx.moveTo(lx - cs / 2, ly);
              ctx.lineTo(lx + cs / 2, ly);
              ctx.strokeStyle = color;
              ctx.globalAlpha = alpha;
              ctx.lineWidth = lineW;
              ctx.shadowColor = color;
              ctx.shadowBlur = willBeOn ? 4 : 12;
              ctx.stroke();
              ctx.shadowBlur = 0;
              ctx.globalAlpha = 1;
            }
          } else {
            for (let y = laser.y1; y <= laser.y2; y++) {
              if (MAZE[y][laser.x1] === 1) continue;
              const lx = laser.x1 * cs + cs / 2;
              const ly = y * cs + cs / 2;
              ctx.beginPath();
              ctx.moveTo(lx, ly - cs / 2);
              ctx.lineTo(lx, ly + cs / 2);
              ctx.strokeStyle = color;
              ctx.globalAlpha = alpha;
              ctx.lineWidth = lineW;
              ctx.shadowColor = color;
              ctx.shadowBlur = willBeOn ? 4 : 12;
              ctx.stroke();
              ctx.shadowBlur = 0;
              ctx.globalAlpha = 1;
            }
          }

          // Collision (only when fully on)
          if (isOn && s.hitCooldown <= 0 && !s.won) {
            let playerHit = false;
            if (laser.horizontal) {
              if (s.playerY === laser.y1 && s.playerX >= laser.x1 && s.playerX <= laser.x2 && MAZE[laser.y1][s.playerX] === 0) {
                playerHit = true;
              }
            } else {
              if (s.playerX === laser.x1 && s.playerY >= laser.y1 && s.playerY <= laser.y2 && MAZE[s.playerY][laser.x1] === 0) {
                playerHit = true;
              }
            }
            if (playerHit) {
              playError();
              playLaserSound();
              s.hitCooldown = 1;
              s.particles.addMany(burstExplosion(
                s.playerX * cs + cs / 2,
                s.playerY * cs + cs / 2,
                '#FF073A', 15
              ));
              s.playerX = s.respawnPoint.x;
              s.playerY = s.respawnPoint.y;
              s.trail = [{ x: s.respawnPoint.x, y: s.respawnPoint.y }];
            }
          }
        }

        // Draw emitters on walls
        const emitterColor = willBeOn ? '#FFFF00' : isOn ? '#FF073A' : '#FF073A33';
        const glowing = willBeOn || isOn;
        if (laser.horizontal) {
          drawEmitter(ctx, laser.x1 * cs, laser.y1 * cs, cs, emitterColor, glowing);
          drawEmitter(ctx, laser.x2 * cs, laser.y1 * cs, cs, emitterColor, glowing);
        } else {
          drawEmitter(ctx, laser.x1 * cs, laser.y1 * cs, cs, emitterColor, glowing);
          drawEmitter(ctx, laser.x1 * cs, laser.y2 * cs, cs, emitterColor, glowing);
        }
      });

      // Player trail
      s.trail.forEach((pos, i) => {
        const alpha = (i / s.trail.length) * 0.35;
        const trailSize = cs * 0.15 + (i / s.trail.length) * cs * 0.08;
        ctx.beginPath();
        ctx.arc(pos.x * cs + cs / 2, pos.y * cs + cs / 2, trailSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(57, 255, 20, ${alpha})`;
        ctx.fill();
      });

      // Player
      if (s.hitCooldown <= 0 || Math.floor(s.hitCooldown * 8) % 2 === 0) {
        const px = s.playerX * cs + cs / 2;
        const py = s.playerY * cs + cs / 2;
        // Outer glow
        const playerGrad = ctx.createRadialGradient(px, py, 0, px, py, cs * 0.45);
        playerGrad.addColorStop(0, '#39FF1433');
        playerGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = playerGrad;
        ctx.fillRect(px - cs * 0.5, py - cs * 0.5, cs, cs);
        // Main body
        ctx.beginPath();
        ctx.arc(px, py, cs * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = '#39FF14';
        ctx.shadowColor = '#39FF14';
        ctx.shadowBlur = 18;
        ctx.fill();
        ctx.shadowBlur = 0;
        // Inner
        ctx.beginPath();
        ctx.arc(px, py, cs * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // Particles
      s.particles.update();
      s.particles.draw(ctx);

      // Portal particles
      if (!s.won && Math.random() > 0.85) {
        s.particles.addMany(vortex(ex, ey, 1));
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [getCellSize]);

  const cellSize = getCellSize();
  const mazeW = cellSize * MAZE[0].length;
  const mazeH = cellSize * MAZE.length;

  return (
    <div className="screen" style={{ background: 'var(--bg-deep)', gap: '6px', padding: '8px' }}>
      <div className="grid-floor" />

      <h3 className="text-glow-cyan" style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(0.65rem, 1.8vw, 0.9rem)',
        letterSpacing: '2px',
        zIndex: 2,
        margin: 0,
      }}>
        {'\u26A1'} LASER MAZE {'\u26A1'}
      </h3>

      <canvas
        ref={canvasRef}
        style={{
          width: mazeW,
          height: mazeH,
          borderRadius: '8px',
          border: '1px solid #00FFFF33',
          zIndex: 2,
        }}
      />

      <DPad onMove={move} />

      <button
        onClick={() => { playClick(); onBack(); }}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff33',
          cursor: 'pointer',
          fontSize: '0.6rem',
          fontFamily: 'var(--font-display)',
          zIndex: 2,
        }}
      >
        Back to HQ
      </button>

      {won && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a1aee',
          zIndex: 10,
          gap: '20px',
          animation: 'fadeInUp 0.5s ease-out forwards',
        }}>
          <h2 className="title-lg anim-rainbow" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
          }}>
            MAZE CLEARED!
          </h2>
          <div className="anim-pulse-scale" style={{ fontSize: '3rem' }}>
            {'\u{1F320}\u26A1\u{1F320}'}
          </div>
          <button className="btn-neon" onClick={onComplete}>
            RETURN TO HQ
          </button>
        </div>
      )}
    </div>
  );
}

function DPad({ onMove }) {
  const btnStyle = {
    width: 'clamp(50px, 12vw, 64px)',
    height: 'clamp(50px, 12vw, 64px)',
    background: '#0d0d24',
    border: '2px solid #39FF1466',
    borderRadius: '14px',
    color: '#39FF14',
    fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'manipulation',
    transition: 'all 0.1s',
    boxShadow: '0 0 8px #39FF1422',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };

  const handlePress = (dx, dy) => (e) => {
    e.preventDefault();
    onMove(dx, dy);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, auto)',
      gridTemplateRows: 'repeat(3, auto)',
      gap: '4px',
      zIndex: 2,
      placeItems: 'center',
    }}>
      <div />
      <button style={btnStyle} onTouchStart={handlePress(0, -1)} onClick={() => onMove(0, -1)}>{'\u25B2'}</button>
      <div />
      <button style={btnStyle} onTouchStart={handlePress(-1, 0)} onClick={() => onMove(-1, 0)}>{'\u25C0'}</button>
      <div style={{ width: 'clamp(50px, 12vw, 64px)', height: 'clamp(50px, 12vw, 64px)' }} />
      <button style={btnStyle} onTouchStart={handlePress(1, 0)} onClick={() => onMove(1, 0)}>{'\u25B6'}</button>
      <div />
      <button style={btnStyle} onTouchStart={handlePress(0, 1)} onClick={() => onMove(0, 1)}>{'\u25BC'}</button>
      <div />
    </div>
  );
}

function drawEmitter(ctx, x, y, cs, color, glowing) {
  const size = cs * 0.12;
  const cx = x + cs / 2;
  const cy = y + cs / 2;
  ctx.fillStyle = color;
  if (glowing) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
  }
  ctx.fillRect(cx - size, cy - size, size * 2, size * 2);
  ctx.shadowBlur = 0;
}
