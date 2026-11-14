import { audio } from "./audio";

export type EchoState = "idle" | "asking" | "recording" | "playing" | "denied" | "unsupported";
export type EchoStyle = "light" | "deep";

// "Send a message back": record what you say (as long as you like, up to 30 seconds), then play it back like a radio call across space.
// It stops when you stop talking for a moment, or when you tap send. The audio stays in the browser: it is not saved or uploaded.
export async function startEcho(
  cb: { state: (s: EchoState) => void; level: (n: number) => void; time: (ms: number) => void; done: () => void },
  opts: { maxMs?: number; style?: EchoStyle } = {},
): Promise<{ stop: () => void } | null> {
  const maxMs = opts.maxMs ?? 30000, style = opts.style ?? "light";
  const node = audio.node();
  if (!node || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { cb.state("unsupported"); return null; }
  cb.state("asking");
  let stream: MediaStream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch { cb.state("denied"); return null; }
  const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((m) => MediaRecorder.isTypeSupported(m));
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined), chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const an = node.ctx.createAnalyser(), src = node.ctx.createMediaStreamSource(stream), buf = new Uint8Array(an.fftSize);
  src.connect(an);
  const t0 = performance.now(); let raf = 0, spoke = false, quietSince = 0, stopped = false;
  const stop = () => { if (!stopped && rec.state === "recording") { stopped = true; rec.stop(); } };
  const loop = () => {
    an.getByteTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v - 128)); const lv = m / 128;
    cb.level(lv); const now = performance.now(); cb.time(now - t0);
    // finish on its own: after you have spoken, a pause of about two seconds ends the message
    if (lv > 0.1) { spoke = true; quietSince = 0; } else if (spoke && lv < 0.035) { if (!quietSince) quietSince = now; else if (now - quietSince > 2200) stop(); }
    if (now - t0 > maxMs) stop();
    raf = requestAnimationFrame(loop);
  };
  rec.onstop = async () => {
    cancelAnimationFrame(raf); cb.level(0); stream.getTracks().forEach((t) => t.stop()); src.disconnect();
    try {
      const abuf = await node.ctx.decodeAudioData(await new Blob(chunks, { type: rec.mimeType }).arrayBuffer());
      cb.state("playing"); playWithEcho(node.ctx, node.out, abuf, style, () => { cb.state("idle"); cb.done(); });
    } catch { cb.state("unsupported"); }
  };
  rec.start(250); cb.state("recording"); loop();
  return { stop };
}

// Radio-style voice plus a fading echo. "light" keeps the words clear; "deep" is a bigger space echo.
function playWithEcho(ctx: AudioContext, out: AudioNode, buf: AudioBuffer, style: EchoStyle, onEnd: () => void) {
  const deep = style === "deep";
  const s = ctx.createBufferSource(); s.buffer = buf;
  const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 260;
  const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3600;
  const comp = ctx.createDynamicsCompressor(); // evens out loud and quiet parts so long messages stay clear
  const dry = ctx.createGain(); dry.gain.value = 1;
  const d1 = ctx.createDelay(2); d1.delayTime.value = deep ? 0.34 : 0.24;
  const fb = ctx.createGain(); fb.gain.value = deep ? 0.4 : 0.2;
  const dlp = ctx.createBiquadFilter(); dlp.type = "lowpass"; dlp.frequency.value = 2000;
  const wet = ctx.createGain(); wet.gain.value = deep ? 0.45 : 0.24;
  s.connect(hp); hp.connect(lp); lp.connect(comp); comp.connect(dry); dry.connect(out);
  comp.connect(d1); d1.connect(dlp); dlp.connect(wet); wet.connect(out); dlp.connect(fb); fb.connect(d1);
  s.start();
  wet.gain.setTargetAtTime(0, ctx.currentTime + buf.duration + (deep ? 1.6 : 0.8), 0.4); // let the echo tail fade out gently after the last word
  setTimeout(onEnd, (buf.duration + (deep ? 3 : 1.8)) * 1000);
}
