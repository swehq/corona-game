import {isEqualWith, isNumber, last} from 'lodash';
import {Game, GameData} from './game';

const EPSILON = 1e-9;

function upToEpsilonCustomizer(value1: any, value2: any) {
  if (isNumber(value1) && isNumber(value2)) {
    const absValue1 = Math.abs(value1);
    if (absValue1 < 1) {
      return Math.abs(value1 - value2) < EPSILON;
    } else {
      return Math.abs(value1 - value2) / absValue1 < EPSILON;
    }
  }
}

export function validateGame(data: GameData, breakImmediately = true): Game | undefined {
  // TODO add test of randomness params (expected distribution or element of interval at least)
  // TODO validate game length, end date
  if (!data.simulation.length) return;

  let res = true;
  const game = new Game(data.scenarioName || 'czechiaGame', data.randomSeed);
  game.mitigationParams = data.mitigations.params;
  game.mitigationHistory = data.mitigations.history;
  game.eventChoices = data.eventChoices;
  game.mitigationControlChanges = data.mitigations.controlChanges;

  for (let i = 0; i < data.simulation.length; i++) {
    const dayData = data.simulation[i];
    const dayCalculated = last(game.simulation.modelStates);

    if (!isEqualWith(dayData, dayCalculated, upToEpsilonCustomizer)) {
      console.error(`Validation failed for ${dayData.date}`, dayData, dayCalculated);
      if (breakImmediately) return;
      else res = false;
    }

    if (i < data.simulation.length - 1) {
      game.applyMitigationsFromHistory();
      game.moveForward();
    }
  }

  if (!res) console.error(`Validation failed, new data: ${JSON.stringify(game.simulation.modelStates, null, 2)}`);

  return game;
}
