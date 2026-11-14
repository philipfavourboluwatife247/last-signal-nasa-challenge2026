// Procedural sound (Web Audio): no audio files, works offline, nothing to license.
// Layers: deep space drone, world-specific air (Moon: hushed, Mars: wind), radio static + crackle,
// signal blips, camera whoosh and UI ticks. Browsers need a tap before audio can start: the "Tune in" button does that.
type World = "moon" | "mars";
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

class Engine {
  private ctx: AudioContext | null = null;
  private master!: GainNode; private white!: AudioBuffer; private brown!: AudioBuffer;
  private moonG!: GainNode; private marsG!: GainNode; private droneG!: GainNode; private padG!: GainNode;
  private o1!: OscillatorNode; private staticG: GainNode | null = null;
  private bootTimers: number[] = []; private crackle = 0; private muted = false; private started = false;

  init() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return;
    const c = (this.ctx = new C());
    const comp = c.createDynamicsCompressor(); this.master = c.createGain(); this.master.gain.value = 0;
    this.master.connect(comp); comp.connect(c.destination);
    const len = c.sampleRate * 3;
    this.white = c.createBuffer(1, len, c.sampleRate); this.brown = c.createBuffer(1, len, c.sampleRate);
    const w = this.white.getChannelData(0), b = this.brown.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const x = Math.random() * 2 - 1; w[i] = x; last = (last + 0.02 * x) / 1.02; b[i] = last * 3.5; }
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, c.currentTime, 0.4);
  }

  private src(buf: AudioBuffer) { const s = this.ctx!.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }

  // Continuous bed: drone + world air + occasional radio crackle.
  startAmbient(world: World) {
    const c = this.ctx; if (!c || this.started) return; this.started = true;
    this.droneG = c.createGain(); this.droneG.gain.value = 0;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380;
    this.o1 = c.createOscillator(); this.o1.frequency.value = 55;
    const o2 = c.createOscillator(); o2.type = "triangle"; o2.frequency.value = 82.4; o2.detune.value = 4;
    const o3 = c.createOscillator(); o3.frequency.value = 110.3;
    [this.o1, o2, o3].forEach((o) => { o.connect(lp); o.start(); });
    lp.connect(this.droneG); this.droneG.connect(this.master);
    const lfo = c.createOscillator(); lfo.frequency.value = 0.06; const lg = c.createGain(); lg.gain.value = 0.02; lfo.connect(lg); lg.connect(this.droneG.gain); lfo.start();

    this.moonG = c.createGain(); this.moonG.gain.value = 0;
    const mlp = c.createBiquadFilter(); mlp.type = "lowpass"; mlp.frequency.value = 220;
    this.src(this.brown).connect(mlp); mlp.connect(this.moonG); this.moonG.connect(this.master);

    this.marsG = c.createGain(); this.marsG.gain.value = 0;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 380; bp.Q.value = 0.6;
    const wl = c.createOscillator(); wl.frequency.value = 0.08; const wg = c.createGain(); wg.gain.value = 150; wl.connect(wg); wg.connect(bp.frequency); wl.start();
    this.src(this.brown).connect(bp); bp.connect(this.marsG); this.marsG.connect(this.master);

    this.padG = c.createGain(); this.padG.gain.value = 0; this.padG.connect(this.master);
    [220, 329.6, 440.5].forEach((f) => { const o = c.createOscillator(); o.frequency.value = f; o.connect(this.padG); o.start(); });

    this.droneG.gain.setTargetAtTime(0.07, c.currentTime, 2.5);
    this.setWorld(world);
    const tick = () => { this.burst(rnd(0.05, 0.18), rnd(0.012, 0.03), rnd(1800, 3800)); this.crackle = window.setTimeout(tick, rnd(3500, 9000)); };
    this.crackle = window.setTimeout(tick, 4000);
  }

  setWorld(w: World) {
    const c = this.ctx; if (!c || !this.moonG) return;
    this.moonG.gain.setTargetAtTime(w === "moon" ? 0.11 : 0, c.currentTime, 1.2);
    this.marsG.gain.setTargetAtTime(w === "mars" ? 0.16 : 0, c.currentTime, 1.2);
    this.o1.frequency.setTargetAtTime(w === "moon" ? 55 : 49, c.currentTime, 1.5);
  }

  // Radio static that breathes while the opening plays, with a soft blip each time the signal pulses.
  bootLoop(on: boolean) {
    const c = this.ctx; if (!c) return;
    this.bootTimers.forEach((t) => clearInterval(t)); this.bootTimers = [];
    if (!on) { this.staticG?.gain.setTargetAtTime(0, c.currentTime, 0.6); return; }
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = 0.7;
    this.staticG = c.createGain(); this.staticG.gain.value = 0;
    this.src(this.white).connect(bp); bp.connect(this.staticG); this.staticG.connect(this.master);
    const g = this.staticG;
    g.gain.setTargetAtTime(0.03, c.currentTime, 0.8);
    this.bootTimers.push(window.setInterval(() => g.gain.setTargetAtTime(rnd(0.008, 0.07), c.currentTime, 0.03), 90));
    this.bootTimers.push(window.setInterval(() => this.beep(1180, 0.09, 0.05), 2200));
    this.beep(1180, 0.09, 0.05);
  }

  swell() {
    const c = this.ctx; if (!c || !this.padG) return;
    this.padG.gain.cancelScheduledValues(c.currentTime);
    this.padG.gain.setTargetAtTime(0.03, c.currentTime, 1.6);
    this.padG.gain.setTargetAtTime(0.0, c.currentTime + 6, 2.5);
    this.droneG.gain.setTargetAtTime(0.12, c.currentTime, 1.2);
    this.droneG.gain.setTargetAtTime(0.07, c.currentTime + 6, 3);
    this.whoosh(5, 0.1);
  }

  beep(freq: number, dur = 0.1, vol = 0.05, type: OscillatorType = "sine") {
    const c = this.ctx; if (!c || this.muted) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(vol, c.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + dur + 0.05);
  }

  // A burst of crackling static (used when tuning in to a machine).
  burst(dur = 0.6, vol = 0.05, freq = 2400) {
    const c = this.ctx; if (!c || this.muted) return;
    const s = c.createBufferSource(); s.buffer = this.white; s.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0; s.connect(bp); bp.connect(g); g.connect(this.master);
    const t = c.currentTime; s.start(t); g.gain.linearRampToValueAtTime(vol, t + 0.02);
    for (let x = 0.05; x < dur; x += 0.045) g.gain.setValueAtTime(vol * rnd(0.1, 1), t + x);
    g.gain.linearRampToValueAtTime(0, t + dur); s.stop(t + dur + 0.05);
  }

  whoosh(dur = 4, vol = 0.16) {
    const c = this.ctx; if (!c || this.muted) return;
    const s = c.createBufferSource(); s.buffer = this.white; s.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 0.9;
    const g = c.createGain(); g.gain.value = 0; s.connect(bp); bp.connect(g); g.connect(this.master);
    const t = c.currentTime; s.start(t);
    bp.frequency.setValueAtTime(180, t); bp.frequency.exponentialRampToValueAtTime(2200, t + dur * 0.5); bp.frequency.exponentialRampToValueAtTime(260, t + dur);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.45); g.gain.linearRampToValueAtTime(0, t + dur); s.stop(t + dur + 0.1);
  }

  // Low boom for an asteroid impact, plus a rumble of noise.
  impact(vol = 0.6) {
    const c = this.ctx; if (!c || this.muted) return;
    const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(110, c.currentTime); o.frequency.exponentialRampToValueAtTime(32, c.currentTime + 0.7);
    g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(vol * 0.35, c.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.1);
    o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + 1.2);
    const s = c.createBufferSource(); s.buffer = this.brown; const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420;
    const ng = c.createGain(); ng.gain.setValueAtTime(vol * 0.5, c.currentTime); ng.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 1.4);
    s.connect(lp); lp.connect(ng); ng.connect(this.master); s.start(); s.stop(c.currentTime + 1.5);
  }

  // A faint high sweep for a shooting star.
  shoot() {
    const c = this.ctx; if (!c || this.muted) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(3200, c.currentTime); o.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.5);
    g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(0.012, c.currentTime + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6);
    o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + 0.7);
  }

  // --- Tuning game: static fades out and a clean tone fades in as the dial nears the signal ---
  private tn: { n: AudioBufferSourceNode; ng: GainNode; o: OscillatorNode; og: GainNode } | null = null;
  tuneStart(freq = 440) {
    const c = this.ctx; if (!c || this.tn) return;
    const n = c.createBufferSource(); n.buffer = this.white; n.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.7;
    const ng = c.createGain(); ng.gain.value = 0.0; n.connect(bp); bp.connect(ng); ng.connect(this.master);
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = freq; const og = c.createGain(); og.gain.value = 0; o.connect(og); og.connect(this.master);
    n.start(); o.start(); this.tn = { n, ng, o, og };
    ng.gain.setTargetAtTime(0.06, c.currentTime, 0.1);
  }
  tuneSet(clarity: number, freq: number) {
    const c = this.ctx; if (!c || !this.tn) return;
    this.tn.ng.gain.setTargetAtTime(0.005 + (1 - clarity) * 0.07, c.currentTime, 0.05);
    this.tn.og.gain.setTargetAtTime(clarity * clarity * 0.07, c.currentTime, 0.05);
    this.tn.o.frequency.setTargetAtTime(freq, c.currentTime, 0.05);
  }
  tuneStop() {
    const c = this.ctx, t = this.tn; if (!c || !t) return; this.tn = null;
    t.ng.gain.setTargetAtTime(0, c.currentTime, 0.08); t.og.gain.setTargetAtTime(0, c.currentTime, 0.08);
    setTimeout(() => { try { t.n.stop(); t.o.stop(); } catch { /* already stopped */ } }, 500);
  }
  lock() { this.beep(880, 0.25, 0.06); setTimeout(() => this.beep(1320, 0.35, 0.05), 90); }
  good() { this.beep(660, 0.1, 0.05); setTimeout(() => this.beep(990, 0.18, 0.05), 90); }
  bad() { this.beep(180, 0.22, 0.05, "sawtooth"); }
  reward() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.beep(f, 0.4, 0.05, "triangle"), i * 110)); }

  // A short marker blip when the replay reaches a new moment; the tone changes with the kind of moment.
  ping(kind: "arrive" | "discover" | "trouble" | "end" | "live") {
    const f = { arrive: 660, discover: 880, trouble: 220, end: 330, live: 990 }[kind];
    this.beep(f, 0.18, 0.05, kind === "trouble" ? "sawtooth" : "sine");
    if (kind === "discover" || kind === "live") setTimeout(() => this.beep(f * 1.5, 0.2, 0.04), 100);
  }
  // Laser pulse out to the Moon, and the faint echo back.
  laser() {
    const c = this.ctx; if (!c || this.muted) return;
    const o = c.createOscillator(), g = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(2400, c.currentTime); o.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.45);
    g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(0.03, c.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.5);
    o.connect(g); g.connect(this.master); o.start(); o.stop(c.currentTime + 0.55);
    setTimeout(() => this.beep(1500, 0.3, 0.02), 1300);
  }

  // Lets other modules (the microphone echo) play through the same output.
  node(): { ctx: AudioContext; out: AudioNode } | null { return this.ctx ? { ctx: this.ctx, out: this.master } : null; }

  tuneIn() { this.burst(0.9, 0.06, 2000); this.beep(700, 0.08, 0.05); setTimeout(() => this.beep(1400, 0.12, 0.05), 110); }
  click() { this.beep(1800, 0.035, 0.03, "triangle"); }
  type() { this.beep(2600, 0.012, 0.008, "triangle"); }
  close() { this.beep(520, 0.09, 0.04); }

  setMuted(m: boolean) {
    this.muted = m; const c = this.ctx; if (!c) return;
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, c.currentTime, 0.15);
  }
}

export const audio = new Engine();
