import {clippedLogNormalSampler} from './utils';

interface Settings {
  rNoiseMult: [number, number];
  baseMortality: [number, number];
  hospitalizationRate: [number, number];
}

export const settings: Settings = {
  rNoiseMult: [1.0, 0.15],
  baseMortality: [0.02, 0.001],
  hospitalizationRate: [0.05, 0.01],
};

function getRandom(variable: keyof typeof settings) {
  return clippedLogNormalSampler(settings[variable][0], settings[variable][1]);
}

export function getRandomness() {
  return {
    rNoiseMult: getRandom('rNoiseMult')(),
    baseMortality: getRandom('baseMortality')(),
    hospitalizationRate: getRandom('hospitalizationRate')(),
  };
}
