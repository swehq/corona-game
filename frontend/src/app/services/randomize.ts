import seedrandom from 'seedrandom';

interface MeanAndStDev {
  mean: number;
  stdev: number;
}

export interface RandomnessSettings {
  rNoiseMult: MeanAndStDev;
  baseMortality: MeanAndStDev;
  hospitalizationRate: MeanAndStDev;
  detectionRate: MeanAndStDev;
}

export interface Randomness {
  rNoiseMult: number;
  baseMortality: number;
  hospitalizationRate: number;
  detectionRate: number;
  eventRandomSeed: number;
}

export class SeededRandom {
  private _rng;
  settings: RandomnessSettings;

  constructor(seed: string, settings: RandomnessSettings) {
    this._rng = seedrandom(seed);
    this.settings = settings;
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

  private getRandom(variable: keyof RandomnessSettings) {
    return this.clippedLogNormal(this.settings[variable].mean, this.settings[variable].stdev);
  }
}
