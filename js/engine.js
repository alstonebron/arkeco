/* ARK ECO — playback engine. Not encoded-video scrubbing: each camera travel renders
   synchronously on a canvas from a deterministic frame provider, controlled by a
   smoothed scroll timeline. Procedural providers stand in until the pre-rendered
   Blender/C4D WebP sequences drop in (same seek contract). */

/* ---------- smoothed scroll timeline ---------- */
const Timeline = (() => {
  let target = 0, current = 0, raf = null;
  const listeners = new Set();
  const measure = () => {
    target = window.scrollY || window.pageYOffset || 0;
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const tick = () => {
    current += (target - current) * 0.18;            // the smoothing law
    if (Math.abs(target - current) < 0.4) { current = target; raf = null; }
    else raf = requestAnimationFrame(tick);
    for (const fn of listeners) fn(current);
  };
  window.addEventListener('scroll', measure, { passive: true });
  return {
    get current() { return current; },
    jump(y) { current = y; target = y; window.scrollTo(0, y); for (const fn of listeners) fn(y); },
    on(fn) { listeners.add(fn); }
  };
})();

/* ---------- deterministic frame provider ---------- */
class SeqPlayer {
  constructor(canvas, sceneFn, frames) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sceneFn = sceneFn;
    this.frames = frames || frameCount;              // per-sequence law (6s→176, 10s→300)
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);  // the WebKit dpr law
    this.cache = new Map();
    this.lastFrame = -1;
    this.render(0);
  }
  resize() {
    const { canvas, dpr } = this;
    let w = canvas.clientWidth * dpr;
    let h = canvas.clientHeight * dpr;
    // cap total pixels to keep performance sane on retina/ultrawide, but preserve viewport aspect
    const maxPixels = 1440 * 810 * dpr * dpr;
    if (w * h > maxPixels) {
      const scale = Math.sqrt(maxPixels / (w * h));
      w *= scale; h *= scale;
    }
    w |= 0; h |= 0;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; this.lastFrame = -1; }
  }
  seek(t) {                      // t: 0..1 progress — clamped to the narrative ratchet
    t = Math.max(Math.max(0, Math.min(1, t)), this.ratchetT || 0);
    const frame = Math.round(this.frames * t);
    if (frame === this.lastFrame) return;
    this.render(frame);
    this.lastFrame = frame;
  }
  /* narrative authority: scenes carry themselves once reached.
     'once' plays forward and holds the final frame; 'pingpong' reverses endlessly.
     Progress raises a one-way ratchet, so scroll always shows played frames
     (scrub back to revisit, forward never repeats). */
  setAuto(mode) {
    if (mode === this.autoMode) return;
    this.autoMode = mode;
    if (mode) {
      if (!this.autoRaf) {
        this.autoFrame = (this.lastFrame >= 0 ? this.lastFrame : 0) / this.frames;
        this.autoDir = 1;
        this.autoTick = performance.now();
        const step = (now) => {
          if (!this.autoMode) { this.autoRaf = null; return; }
          const dt = Math.min(120, now - this.autoTick); this.autoTick = now;
          this.autoFrame += dt * 0.001 * 30 / this.frames * this.autoDir;   // the 30fps law
          if (this.autoFrame >= 1) {
            this.autoFrame = 1;
            this.autoDir = this.autoMode === 'pingpong' ? -1 : 0;          // 'once' holds
          }
          if (this.autoFrame <= 0) { this.autoFrame = 0; this.autoDir = 1; }
          this.ratchetT = Math.max(this.ratchetT || 0, this.autoFrame);
          const fr = Math.round(this.frames * this.autoFrame);
          if (fr !== this.lastFrame) { this.render(fr); this.lastFrame = fr; }
          this.autoRaf = requestAnimationFrame(step);
        };
        this.autoRaf = requestAnimationFrame(step);
      }
    } else if (this.autoRaf) {
      cancelAnimationFrame(this.autoRaf);
      this.autoRaf = null;
    }
  }
  render(frame) {
    const { ctx, canvas } = this;
    const w = canvas.width, h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.sceneFn(ctx, frame, w, h, this.frames, this);
  }
}

const frameCount = 176;         // 30fps × 5.875s — the master law (Hailuo 6s clips render 176 steps)

/* ---------- scene library (procedural stand-ins, deterministic per frame) ---------- */
const Scenes = (() => {
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  const sky = (ctx, w, h, top, bottom, t) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    const rgb = row => `rgb(${row.slice(0, 3).join(',')})`;
    const mix = (a, b, k) => a.map((v, i) => Math.round(lerp(v, b[i], k)));
    g.addColorStop(0, rgb(top));
    g.addColorStop(1, rgb(mix(top, bottom, t)));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  const stars = (ctx, w, h, t, n = 90) => {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = ((i * 2654435761) % 1000) / 1000 * w;
      const y = ((i * 40503) % 600) / 600 * h * 0.5;
      const tw = 0.25 + 0.25 * Math.sin(frameCount * 0.35 + i);
      ctx.globalAlpha = tw * (0.4 + 0.6 * t);
      ctx.fillStyle = '#f4ecf4';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  };
  const sun = (ctx, w, h, x, y, r, a = 0.25) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,194,14,${a})`);
    g.addColorStop(1, 'rgba(255,194,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const pulse = (ctx, x1, y1, x2, y2, t, hue = '255,194,14') => {
    ctx.save();
    ctx.strokeStyle = `rgba(${hue},${0.5 + 0.3 * Math.sin(frameCount * 0.6 + x1)})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -frameCount * 0.9;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2, Math.min(y1, y2) - 40, x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  const ACT = {};  // per-act draw functions keyed by name

  /* ACT 0 — cinematic hook: storm → home → traces → pull-back reveal */
  ACT.hook = (ctx, f, w, h) => {
    const t = f / frameCount;
    sky(ctx, w, h, [30, 24, 44], [48, 36, 54], ease(Math.min(1, t * 1.4)));
    stars(ctx, w, h, 0.3);
    sun(ctx, w, h, w * 0.8, h * 0.2, w * 0.3, 0.12);
    // storm cell sweeping in during first third
    const cellA = Math.max(0, Math.min(1, 1.2 - t * 2));
    if (cellA > 0) {
      ctx.save();
      ctx.globalAlpha = cellA * 0.85;
      const cx = lerp(w * 0.1, w * 0.5, ease(t * 1.6));
      const g = ctx.createRadialGradient(cx, h * 0.22, 0, cx, h * 0.22, w * 0.28);
      g.addColorStop(0, 'rgba(20,14,24,0.95)');
      g.addColorStop(1, 'rgba(20,14,24,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      if (Math.sin(f * 0.5) > 0.92) {                     // lightning inside the cell
        ctx.strokeStyle = 'rgba(244,236,244,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, h * 0.12);
        ctx.lineTo(cx + 24, h * 0.2);
        ctx.lineTo(cx + 10, h * 0.2);
        ctx.lineTo(cx + 34, h * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }
    // skyline settles in mid-act
    const sky0 = ease(Math.max(0, (t - 0.28) * 1.6));
    if (sky0 > 0) {
      ctx.save();
      ctx.globalAlpha = sky0;
      const groundY = lerp(h, h * 0.72, sky0);
      ctx.fillStyle = '#241a22';
      ctx.fillRect(0, groundY, w, h - groundY);
      // a Florida home with standing seam roof
      const hx = w * 0.42, hw = w * 0.16, hh = h * 0.1;
      ctx.fillStyle = '#382a36';
      ctx.beginPath();
      ctx.moveTo(hx, groundY);
      ctx.lineTo(hx, groundY - hh);
      ctx.lineTo(hx + hw * 0.5, groundY - hh - h * 0.05);
      ctx.lineTo(hx + hw, groundY - hh);
      ctx.lineTo(hx + hw, groundY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,194,14,0.5)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {                       // seam lines
        const sx = lerp(hx, hx + hw, i / 6);
        ctx.globalAlpha = sky0 * 0.6;
        ctx.beginPath();
        ctx.moveTo(lerp(hx, hx + hw * 0.5, i / 6), groundY - hh - (h * 0.05) * (1 - i / 6));
        ctx.lineTo(lerp(hx + hw * 0.5, hx + hw, i / 6), groundY - hh);
        ctx.stroke();
      }
      ctx.globalAlpha = sky0;
      // gold trace lights the roofline, runs to the wall
      const trace = ease(Math.max(0, (t - 0.55) * 3));
      if (trace > 0) {
        ctx.strokeStyle = `rgba(255,194,14,${0.85 * trace})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx, groundY - hh);
        ctx.lineTo(hx + hw * 0.5, groundY - hh - h * 0.05);
        ctx.lineTo(hx + hw, groundY - hh);
        ctx.stroke();
      }
      ctx.restore();
    }
    // pull-back reveal: traces light across a mini-map, wordmark drifts up
    const reveal = ease(Math.max(0, (t - 0.78) * 4.5));
    if (reveal > 0) {
      ctx.save();
      ctx.globalAlpha = reveal;
      for (let i = 0; i < 7; i++) {
        const x = lerp(w * 0.2, w * 0.8, i / 6);
        const y = groundY0(h);
        pulse(ctx, x, y, x + 90, y - 30, t);
      }
      ctx.font = `600 ${Math.round(w * 0.028)}px "Segoe UI",system-ui`;
      ctx.fillStyle = '#f4ecf4';
      ctx.textAlign = 'center';
      ctx.fillText('A R K   E C O', w / 2, h * 0.24);
      ctx.font = `${Math.round(w * 0.012)}px "Segoe UI",system-ui`;
      ctx.fillStyle = 'rgba(255,194,14,0.9)';
      ctx.fillText('THE FRONTIER OF SUSTAINABLE CONSTRUCTION', w / 2, h * 0.27);
      ctx.restore();
    }
  };
  const groundY0 = h => h * 0.66;

  /* relief-model hover: mini Florida silhouette with pulses (used by map ambient + returns) */
  ACT.relief = (ctx, f, w, h) => {
    sky(ctx, w, h, [26, 20, 30], [40, 30, 44], 0.4);
    sun(ctx, w, h, w * 0.15, h * 0.15, w * 0.25, 0.1);
    const gy = h * 0.78;
    ctx.fillStyle = '#241a24';
    ctx.fillRect(0, gy, w, h - gy);
    // stylized peninsula rising above the ground plane
    const pts = [[w*0.38, gy], [w*0.36, gy - h*0.08], [w*0.42, gy - h*0.1],
                 [w*0.5, gy - h*0.24], [w*0.56, gy - h*0.36], [w*0.6, gy - h*0.44],
                 [w*0.63, gy - h*0.5], [w*0.665, gy - h*0.52], [w*0.67, gy - h*0.46],
                 [w*0.64, gy - h*0.38], [w*0.6, gy - h*0.28], [w*0.57, gy - h*0.16],
                 [w*0.53, gy - h*0.06], [w*0.5, gy]];
    ctx.save();
    ctx.translate(0, -h * 0.06);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, gy, 0, gy - h * 0.6);
    g.addColorStop(0, '#4a3a48');
    g.addColorStop(1, '#6a5468');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(79,216,224,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    // transmission pulses between beacon points
    const b = f => [[w*0.47, gy - h*0.3], [w*0.53, gy - h*0.18], [w*0.6, gy - h*0.2], [w*0.55, gy - h*0.24]][f];
    const P = [0, 1, 2, 3];
    for (let i = 0; i < P.length; i++)
      for (let j = i + 1; j < P.length; j++) {
        const [ax, ay] = b(i), [bx, by] = b(j);
        pulse(ctx, ax, ay, bx, by, 0);
      }
    stars(ctx, w, h, 0.25);
  };

  /* regional leg scenes: parameterized by region scene palette */
  const legScene = (regionKey, segIndex) => (ctx, f, w, h) => {
    const R = ARK.regions[regionKey];
    const pal = palOf(R, segIndex);
    const t = f / frameCount;
    sky(ctx, w, h, pal.sky[0], pal.sky[1], ease(t));
    stars(ctx, w, h, 0.2);
    const gy = h * 0.74;
    const rgb = row => `rgb(${row.slice(0, 3).join(',')})`;
    const g = ctx.createLinearGradient(0, gy - 40, 0, gy + 60);
    g.addColorStop(0, rgb(pal.land[0]));
    g.addColorStop(1, rgb(pal.land[1]));
    ctx.fillStyle = g;
    ctx.fillRect(0, gy - 40, w, h - gy + 100);
    sun(ctx, w, h, w * 0.82, h * 0.24, w * 0.24, 0.14);
    drawSilhouette(ctx, regionKey, segIndex, f, w, h, gy, pal);
  };

  const palOf = (R, segIndex) => {
    const frac = segIndex / 6;
    const mixRow = (a, b, k) => a.map((v, i) => Math.round(lerp(v, b[i], k)));
    return {
      sky: [ mixRow(R.scenes.sky[0], R.scenes.sky[1], frac), mixRow(R.scenes.sky[1], R.scenes.sky[2], frac) ],
      land: [ mixRow(R.scenes.land[0], R.scenes.land[1], frac), mixRow(R.scenes.land[1], R.scenes.land[2], frac) ]
    };
  };

  /* silhouettes per region (procedural stand-ins; replaced by the WebP sequences) */
  const drawSilhouette = (ctx, key, segIndex, f, w, h, gy, pal) => {
    const t = f / frameCount;
    ctx.save();
    ctx.globalAlpha = 0.92;
    const S = f => f * (w / 1440);
    if (key === 'haven') {
      // agrivoltaic rows: tilted panel rows over citrus
      for (let i = 0; i < 6; i++) {
        const x = S(160 + i * 190);
        const y = gy - 30 - (i % 2) * 14;
        ctx.fillStyle = '#2c2130';
        ctx.fillRect(x, y + 26, 8, 34);
        ctx.fillStyle = '#6a5468';
        ctx.fillRect(x - 6, y, 120, 16);
        ctx.fillStyle = 'rgba(255,194,14,0.35)';
        ctx.fillRect(x - 6, y + 16, 120, 3);
        ctx.fillStyle = '#4f6b45';
        for (let j = 0; j < 3; j++) {
          ctx.beginPath();
          ctx.arc(x + 22 + j * 36, y + 52, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (segIndex >= 2) {  // packhouse canopy
        ctx.fillStyle = '#3a2c3a';
        ctx.fillRect(S(900), gy - 96, S(320), 96);
        ctx.fillStyle = '#6a5468';
        ctx.fillRect(S(880), gy - 120, S(360), 22);
        ctx.strokeStyle = 'rgba(255,194,14,0.5)';
        ctx.strokeRect(S(880), gy - 120, S(360), 22);
      }
      if (segIndex === 4) { // microgrid rise: link traces
        for (let i = 0; i < 5; i++)
          pulse(ctx, S(220 + i * 190), gy - 60, S(1000), gy - 120, 0);
      }
    } else if (key === 'coast') {
      // the property: roof + pergola + garage
      ctx.fillStyle = '#2c2130';
      ctx.fillRect(S(420), gy - 60, S(420), 60);
      ctx.fillStyle = '#6a5468';
      ctx.beginPath();
      ctx.moveTo(S(400), gy - 60);
      ctx.lineTo(S(560), gy - 130);
      ctx.lineTo(S(740), gy - 60);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,194,14,0.5)';
      for (let i = 0; i < 7; i++) {
        const k = i / 7;
        ctx.beginPath();
        ctx.moveTo(lerp(S(400), S(560), k), gy - 60 - (S(560) - S(400)) * 0 + (gy - 130 - (gy - 60)) * k);
        ctx.lineTo(lerp(S(560), S(740), k), gy - 130 + (gy - 60 - (gy - 130)) * k);
        ctx.stroke();
      }
      // pergola over driveway
      ctx.fillStyle = '#382a36';
      ctx.fillRect(S(200), gy - 88, S(10), 88);
      ctx.fillRect(S(330), gy - 88, S(10), 88);
      ctx.fillRect(S(180), gy - 100, S(180), 14);
      ctx.fillStyle = 'rgba(255,194,14,0.4)';
      ctx.fillRect(S(180), gy - 86, S(180), 3);
      // car under pergola
      ctx.fillStyle = '#241a22';
      ctx.fillRect(S(230), gy - 34, S(110), 22);
      ctx.fillRect(S(260), gy - 48, S(50), 16);
      if (segIndex >= 3) {  // power room glimpse: battery stack
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = '#443350';
          ctx.fillRect(S(950), gy - 40 - i * 26, S(60), 22);
          ctx.fillStyle = 'rgba(255,194,14,0.5)';
          ctx.fillRect(S(955), gy - 36 - i * 26, S(50), 2);
        }
      }
      if (segIndex === 4) { // generator pad
        ctx.fillStyle = '#3a2c3a';
        ctx.fillRect(S(1060), gy - 30, S(90), 30);
        ctx.fillStyle = 'rgba(255,194,14,0.4)';
        ctx.fillRect(S(1066), gy - 24, S(78), 2);
      }
      if (segIndex === 5) {
        for (let i = 0; i < 4; i++)
          pulse(ctx, S(560), gy - 100, S(180 + i * 200), gy - 40, 0);
      }
    } else if (key === 'atlantic') {
      // the street: neon buildings igniting one by one
      const ignite = i => Math.max(0, Math.min(1, (t - 0.08 * i) * 3));
      for (let i = 0; i < 7; i++) {
        const bw = S(150 + (i % 3) * 40), bh = S(120 + ((i * 37) % 140));
        const bx = S(80 + i * 195), by = gy - bh;
        ctx.fillStyle = '#2c2130';
        ctx.fillRect(bx, by, bw, bh);
        const k = ignite(i);
        // windows flicker on
        for (let r = 0; r < 4; r++)
          for (let c = 0; c < 4; c++) {
            ctx.globalAlpha = 0.85 * k;
            ctx.fillStyle = (r + c + i) % 3 ? 'rgba(255,194,14,0.7)' : 'rgba(79,216,224,0.6)';
            ctx.fillRect(bx + S(14) + c * S(32), by + S(16) + r * S(28), S(18), S(14));
          }
        ctx.globalAlpha = k;
        ctx.strokeStyle = i % 2 ? 'rgba(255,194,14,0.8)' : 'rgba(79,216,224,0.7)';
        ctx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
        ctx.globalAlpha = 1;
      }
      if (segIndex >= 5) pulse(ctx, S(120), gy + 10, S(1400), gy - 30, 0);
    } else if (key === 'eden') {
      // the homestead: glowing homestead + emerald loops
      ctx.fillStyle = '#2c2130';
      ctx.fillRect(S(560), gy - 74, S(260), 74);
      ctx.fillStyle = '#6a5468';
      ctx.beginPath();
      ctx.moveTo(S(540), gy - 74);
      ctx.lineTo(S(690), gy - 140);
      ctx.lineTo(S(840), gy - 74);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(63,216,160,0.25)';
      ctx.fillRect(S(560), gy - 70, S(260), 3);
      // water trace looping to beds
      ctx.save();
      ctx.strokeStyle = `rgba(63,216,160,${0.4 + 0.2 * Math.sin(f * 0.4)})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 7]);
      ctx.lineDashOffset = -f;
      ctx.beginPath();
      ctx.moveTo(S(820), gy);
      ctx.quadraticCurveTo(S(980), gy - 60, S(1060), gy);
      ctx.quadraticCurveTo(S(1160), gy + 50, S(1260), gy);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,194,14,0.4)';
      ctx.fillRect(S(545), gy - 136, S(290), 2);
      if (segIndex >= 3) pulse(ctx, S(690), gy - 140, S(400), gy - 60, 0, '63,216,160');
      if (segIndex === 4) {
        pulse(ctx, S(690), gy - 140, S(1000), gy - 90, 0, '63,216,160');
        pulse(ctx, S(690), gy - 140, S(1400), gy - 100, 0);
      }
    }
    ctx.restore();
  };

  /* dive sweep: relief → target region, parameterized */
  const diveScene = (regionKey, landingScene) => (ctx, f, w, h) => {
    const t = ease(f / frameCount);
    // first half: relief model receding; second half: region palette landing
    const R = ARK.regions[regionKey];
    const half = t < 0.5 ? 0 : 1;
    if (half === 0) {
      ctx.save();
      ctx.globalAlpha = 1 - t * 2;
      ACT.relief(ctx, f, w, h);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = (t - 0.5) * 2;
      (landingScene || legScene(regionKey, 0))(ctx, f, w, h);
      ctx.restore();
    }
    // descent vignette
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(10,6,10,${0.5 * (1 - Math.abs(t - 0.5) * 2)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };

  /* ---------- still mode: pre-painted scenes, scrubbed via push-in + drift ---------- */
  const stills = new Map();
  const loadStill = (path, done) => {
    if (stills.has(path)) return stills.get(path);
    const img = new Image();
    img.onload = done;
    img.src = path;
    stills.set(path, img);
    return img;
  };

  /* per-leg grading: each leg locks its own palette over the shared warm-cool fall */
  const LEG_GRADE = {
    haven: 'rgba(34,40,34,0.12)',       // cool heartland dawn
    coast: 'rgba(44,34,26,0.10)',       // warm Gulf dusk
    atlantic: 'rgba(40,30,46,0.14)',    // neon plum night
    eden: 'rgba(26,44,36,0.12)'         // emerald dusk
  };

  /* ---------- pre-rendered sequence travel (Blender/C4D producer contract) ----------
     Each scene = assets/seq_<dir>/s0001.webp…s0180.webp (30fps × 6s master law).
     Sliding window: decode [cur-14, cur+14] on seek; draw the nearest decoded frame
     outward when the exact index isn't ready, so scrubbing never shows a gap. */
  const seqs = new Map();   // dir -> { imgs: Map(index -> Image), pending: Set, failed: Set }
  const seqWindow = 14;

  const seqDir = (dir) => {
    if (!seqs.has(dir)) seqs.set(dir, { imgs: new Map(), pending: new Set(), failed: new Set() });
    return seqs.get(dir);
  };

  const loadSeqFrame = (dir, idx, st, onDone) => {
    if (st.imgs.has(idx) || st.pending.has(idx) || st.failed.has(idx)) return;
    st.pending.add(idx);
    const img = new Image();
    img.onload = () => { st.pending.delete(idx); st.imgs.set(idx, img); if (onDone) onDone(); };
    img.onerror = () => { st.pending.delete(idx); st.failed.add(idx); };
    img.src = `assets/seq_${dir}/s${String(idx + 1).padStart(4, '0')}.webp`;
  };

  const seqHasFrame = (dir, idx) => {
    const st = seqDir(dir);
    return st.imgs.has(idx) || st.failed.has(idx);
  };

  const refreshSeqWindow = (dir, cur) => {
    const st = seqDir(dir);
    for (let d = 0; d <= seqWindow; d++) {
      loadSeqFrame(dir, cur + d, st);
      if (d) loadSeqFrame(dir, cur - d, st);
    }
  };

  const seqTravel = (dir, regionKey) => (ctx, f, w, h, count, player) => {
    const st = seqDir(dir);
    const target = Math.min(count - 1, Math.max(0, Math.round(f)));
    refreshSeqWindow(dir, target);
    let draw = -1;
    if (st.imgs.has(target)) draw = target;
    else for (let d = 1; d <= count; d++) {
      if (st.imgs.has(target + d)) { draw = target + d; break; }
      if (st.imgs.has(target - d)) { draw = target - d; break; }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1d151d';
    ctx.fillRect(0, 0, w, h);
    if (draw >= 0) {
      const img = st.imgs.get(draw);
      const cover = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * cover, dh = img.naturalHeight * cover;
      ctx.save();
      ctx.filter = 'saturate(1.07) contrast(1.06) brightness(0.98)';
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.restore();
      if (LEG_GRADE[regionKey]) { ctx.fillStyle = LEG_GRADE[regionKey]; ctx.fillRect(0, 0, w, h); }
      const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.95);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(20,12,20,0.26)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
    }
  };

  /* returns whether a scene has a full sequence on disk (director check) */
  const seqExists = (dir) => seqs.has(dir) && seqDir(dir).imgs.size > 0;


  const stillScene = (path, regionKey) => (ctx, f, w, h, count, player) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#1d151d';
    ctx.fillRect(0, 0, w, h);
    const img = loadStill(path, () => { if (player) { player.lastFrame = -1; player.render(0); } });
    if (img.complete && img.naturalWidth) {
      const t = ease(f / count);
      const zoom = 1.05 + 0.09 * t;                 // the scrub push-in
      const driftX = w * 0.02 * ease(Math.max(0, (f / count - 0.4) / 0.6));
      const cover = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
      const dw = img.naturalWidth * cover, dh = img.naturalHeight * cover;
      ctx.save();
      ctx.filter = 'saturate(1.07) contrast(1.06) brightness(0.98)';   // the grade pass
      ctx.drawImage(img, (w - dw) / 2 - driftX, (h - dh) / 2, dw, dh);
      ctx.restore();
      // leg grade + vertical warm-cool fall + vignette
      if (LEG_GRADE[regionKey]) { ctx.fillStyle = LEG_GRADE[regionKey]; ctx.fillRect(0, 0, w, h); }
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(38,29,38,0.12)');
      g.addColorStop(0.5, 'rgba(38,29,38,0)');
      g.addColorStop(1, 'rgba(29,21,29,0.24)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.95);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(20,12,20,0.30)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, w, h);
    }
  };

  return { ACT, legScene, diveScene, stillScene, seqTravel, seqExists, loadStill };
})();
