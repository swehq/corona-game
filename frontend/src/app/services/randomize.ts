import {normalPositiveSampler} from './utils';

interface Settings {
  R: [number, number];
  mortality: [number, number];
  hospitalizationRate: [number, number];
}

export const settings: Settings = {
  R: [1.0, 0.15],
  mortality: [0.02, 0.001],
  hospitalizationRate: [0.05, 0.01],
};

export function getRandom(variable: keyof typeof settings) {
  return normalPositiveSampler(settings[variable][0], settings[variable][0]);
}
