import {clippedLogNormalSampler} from './utils';

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

function getRandom(variable: keyof typeof settings) {
  return clippedLogNormalSampler(settings[variable][0], settings[variable][1]);
}

export function getRandomness() {
  return {
    rNoiseMult: getRandom('rNoiseMult')(),
    baseMortality: getRandom('baseMortality')(),
    hospitalizationRate: getRandom('hospitalizationRate')(),
    detectionRate: getRandom('detectionRate')(),
  };
}
