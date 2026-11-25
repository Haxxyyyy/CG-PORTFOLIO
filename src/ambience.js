// Forest ambience, synthesised from filtered noise — no audio files, no licences.
// Everything is built on first user gesture and never starts on its own.

import { createAudioTap } from './audio-level.js';

let ctx = null;
let master = null;
let tap = null;
let voices = [];
let playing = false;
let duckTarget = 0.5;

function makeNoiseBuffer(context, seconds = 3) {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < length; index += 1) {
    // Brown-ish noise: integrated white noise reads as wind rather than hiss.
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[index] = last * 3.2;
  }
  return buffer;
}

function buildGraph() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return false;
  ctx = new AudioContextCtor();

  master = ctx.createGain();
  master.gain.value = 0;
  tap = createAudioTap(ctx);
  master.connect(tap.node);
  tap.node.connect(ctx.destination);

  const noise = makeNoiseBuffer(ctx);

  // Wind: band-passed noise, centre frequency wandering slowly.
  const wind = ctx.createBufferSource();
  wind.buffer = noise;
  wind.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = 'bandpass';
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.75;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.55;
  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(master);
  wind.start();

  const windLfo = ctx.createOscillator();
  windLfo.frequency.value = 0.06;
  const windLfoDepth = ctx.createGain();
  windLfoDepth.gain.value = 240;
  windLfo.connect(windLfoDepth);
  windLfoDepth.connect(windFilter.frequency);
  windLfo.start();

  const gustLfo = ctx.createOscillator();
  gustLfo.frequency.value = 0.045;
  const gustDepth = ctx.createGain();
  gustDepth.gain.value = 0.22;
  gustLfo.connect(gustDepth);
  gustDepth.connect(windGain.gain);
  gustLfo.start();

  // Water: faster, brighter, much quieter — the pond at the foot of the tree.
  const water = ctx.createBufferSource();
  water.buffer = noise;
  water.loop = true;
  water.playbackRate.value = 1.9;
  const waterFilter = ctx.createBiquadFilter();
  waterFilter.type = 'highpass';
  waterFilter.frequency.value = 3200;
  const waterGain = ctx.createGain();
  waterGain.gain.value = 0.045;
  water.connect(waterFilter);
  waterFilter.connect(waterGain);
  waterGain.connect(master);
  water.start();

  const waterLfo = ctx.createOscillator();
  waterLfo.frequency.value = 0.31;
  const waterLfoDepth = ctx.createGain();
  waterLfoDepth.gain.value = 0.025;
  waterLfo.connect(waterLfoDepth);
  waterLfoDepth.connect(waterGain.gain);
  waterLfo.start();

  voices = [wind, windLfo, gustLfo, water, waterLfo];
  return true;
}

function teardown() {
  voices.forEach((voice) => {
    try {
      voice.stop();
    } catch {
      /* already stopped */
    }
  });
  voices = [];
  tap = null;
  if (ctx) {
    ctx.close().catch(() => {});
    ctx = null;
  }
}

export function createAmbience() {
  return {
    get playing() {
      return playing;
    },
    async start(level = 0.5) {
      if (!ctx && !buildGraph()) return false;
      duckTarget = level;
      if (ctx.state === 'suspended') await ctx.resume();
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(level, now + 1.6);
      playing = true;
      return true;
    },
    stop() {
      if (!ctx) {
        playing = false;
        return;
      }
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      playing = false;
      window.setTimeout(teardown, 900);
    },
    // Smoothed 0–1 loudness for the scenes; silent until the bed is running.
    level() {
      if (!ctx || !playing || !tap) return 0;
      return tap.sample();
    },
    // Lower the bed while a recording plays, restore it afterwards.
    duck(on) {
      if (!ctx) return;
      const now = ctx.currentTime;
      const target = on ? duckTarget * 0.35 : duckTarget;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(Math.max(target, 0.0001), now + 0.8);
    },
    toggle(level = 0.5) {
      return playing ? this.stop() : this.start(level);
    },
  };
}
