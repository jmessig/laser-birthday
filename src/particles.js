// ============================================
// PARTICLE SYSTEM
// ============================================

const MAX_PARTICLES = 300;

export class Particle {
  constructor({ x, y, vx, vy, life, color, size, decay, gravity, shape }) {
    this.x = x;
    this.y = y;
    this.vx = vx || 0;
    this.vy = vy || 0;
    this.life = life || 1;
    this.maxLife = this.life;
    this.color = color || '#39FF14';
    this.size = size || 3;
    this.decay = decay || 0.02;
    this.gravity = gravity || 0;
    this.shape = shape || 'circle';
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.life -= this.decay;
    this.rotation += this.rotationSpeed;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.size * 2;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'square') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      const s = this.size * alpha;
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.restore();
    } else if (this.shape === 'star') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      drawStar(ctx, 0, 0, 5, this.size * alpha, this.size * alpha * 0.5);
      ctx.restore();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
  ctx.fill();
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  add(particle) {
    if (this.particles.length < MAX_PARTICLES) {
      this.particles.push(particle);
    }
  }

  addMany(particles) {
    for (const p of particles) {
      this.add(p);
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.update());
  }

  draw(ctx) {
    for (const p of this.particles) {
      p.draw(ctx);
    }
  }

  clear() {
    this.particles = [];
  }

  get count() {
    return this.particles.length;
  }
}

// ============================================
// PRESET EMITTERS
// ============================================

const PARTY_COLORS = ['#39FF14', '#00FFFF', '#FF00FF', '#BF00FF', '#FFD700', '#FF073A'];

export function burstExplosion(x, y, color, count = 20) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push(new Particle({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: color || PARTY_COLORS[Math.floor(Math.random() * PARTY_COLORS.length)],
      size: 2 + Math.random() * 3,
      decay: 0.02 + Math.random() * 0.01,
      gravity: 0.05,
      shape: Math.random() > 0.5 ? 'circle' : 'star',
    }));
  }
  return particles;
}

export function confetti(canvasWidth, canvasHeight) {
  const particles = [];
  for (let i = 0; i < 40; i++) {
    particles.push(new Particle({
      x: Math.random() * canvasWidth,
      y: -10 - Math.random() * 50,
      vx: (Math.random() - 0.5) * 2,
      vy: 1.5 + Math.random() * 3,
      life: 1,
      color: PARTY_COLORS[Math.floor(Math.random() * PARTY_COLORS.length)],
      size: 3 + Math.random() * 4,
      decay: 0.003,
      gravity: 0.02,
      shape: 'square',
    }));
  }
  return particles;
}

export function sparkle(x, y, count = 12) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 1,
      vy: -0.5 - Math.random() * 1.5,
      life: 1,
      color: Math.random() > 0.5 ? '#FFD700' : '#FFFFFF',
      size: 1 + Math.random() * 2,
      decay: 0.015,
      gravity: -0.01,
      shape: 'star',
    }));
  }
  return particles;
}

export function laserTrail(x1, y1, x2, y2, color = '#39FF14') {
  const particles = [];
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const count = Math.min(15, Math.floor(dist / 10));
  for (let i = 0; i < count; i++) {
    const t = i / count;
    particles.push(new Particle({
      x: x1 + (x2 - x1) * t + (Math.random() - 0.5) * 4,
      y: y1 + (y2 - y1) * t + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      life: 0.6 + Math.random() * 0.4,
      color,
      size: 1 + Math.random() * 2,
      decay: 0.04,
      gravity: 0,
      shape: 'circle',
    }));
  }
  return particles;
}

export function vortex(x, y, count = 25) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 60;
    particles.push(new Particle({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 2) * 2 - Math.cos(angle) * 1.5,
      vy: Math.sin(angle + Math.PI / 2) * 2 - Math.sin(angle) * 1.5,
      life: 1,
      color: Math.random() > 0.5 ? '#BF00FF' : '#00FFFF',
      size: 1.5 + Math.random() * 2.5,
      decay: 0.02,
      gravity: 0,
      shape: 'circle',
    }));
  }
  return particles;
}
