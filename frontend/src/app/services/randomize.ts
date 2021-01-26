import seedrandom from 'seedrandom';

interface Settings {
  rNoiseMult: [number, number];
  baseMortality: [number, number];
  hospitalizationRate: [number, number];
  detectionRate: [number, number];
}

export const settings: Settings = {
  rNoiseMult: [1.0, 0.05],
  baseMortality: [0.005, 0.00025],
  hospitalizationRate: [0.0125, 0.0025],
  detectionRate: [0.25, 0.05],
};

export interface Randomness {
  rNoiseMult: number;
  baseMortality: number;
  hospitalizationRate: number;
  detectionRate: number;
  eventRandomSeed: number;
}

export class SeededRandom {
  private _rng;

  constructor(seed: string) {
    this._rng = seedrandom(seed);
  }

  random(): number {
    return this._rng();
  }

  randn() {
    const u = 1 - this._rng();
    const v = this._rng();

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // 3 sigma clipped normal distribution
  clippedRandn() {
    let r = this.randn();
    while (Math.abs(r) > 3) {
      r = this.randn();
    }

    return r;
  }

  // 3 sigma clipped log normal (math checks out for sigma << mode)
  clippedLogNormal(mode: number, sigma: number) {
    return mode * Math.exp(this.clippedRandn() * sigma / mode);
  }

  getRandomness(): Randomness {
    const ret = {
      rNoiseMult: this.getRandom('rNoiseMult'),
      baseMortality: this.getRandom('baseMortality'),
      hospitalizationRate: this.getRandom('hospitalizationRate'),
      detectionRate: this.getRandom('detectionRate'),
      eventRandomSeed: this.random(),
    };

    // Reserve two random numbers for the future use
    this.randn();
    this.randn();

    return ret;
  }

  private getRandom(variable: keyof typeof settings) {
    return this.clippedLogNormal(settings[variable][0], settings[variable][1]);
  }
}
