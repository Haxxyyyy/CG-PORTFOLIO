// One smoothed loudness value shared by the particle scenes. Each audio source
// registers an AnalyserNode when it starts; the scenes poll level() per frame.

// Low third of the spectrum: wind, water and the bansuri all live here.
const BAND = 0.35;

export function createAudioTap(context) {
  const analyser = context.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.55;
  const data = new Uint8Array(analyser.frequencyBinCount);
  let level = 0;

  return {
    node: analyser,
    get level() {
      return level;
    },
    sample() {
      analyser.getByteFrequencyData(data);
      const end = Math.max(2, Math.floor(data.length * BAND));
      let sum = 0;
      for (let index = 1; index < end; index += 1) sum += data[index];
      const raw = sum / (end - 1) / 255;
      const target = Math.min(1, raw * 1.6);
      // Quick attack, slow release: the forest leans into a gust, then settles.
      level += (target - level) * (target > level ? 0.22 : 0.055);
      return level;
    },
  };
}
