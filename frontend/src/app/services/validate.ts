import {isEqual, last} from 'lodash';
import {Game, GameData} from './game';
import {Scenario} from './scenario';

export function validateGame(data: GameData, breakImmediately = true): Game | undefined {
  // TODO add test of randomness params (expected distribution or element of interval at least)
  // TODO validate game length, end date
  if (!data.simulation.length) return;

  let res = true;
  // Build a synthetic scenario that contains the replay of historic mitigations
  const scenario = new Scenario({
    rampUpStartDate: data.scenario.dates.rampUpStartDate,
    rampUpEndDate: data.scenario.dates.rampUpStartDate,
    endDate: data.scenario.dates.endDate,
  }, data.mitigations.history);
  const game = new Game(scenario);
  game.mitigationParams = data.mitigations.params;
  game.eventChoices = data.eventChoices;
  game.mitigationControlChanges = data.mitigations.controlChanges;

  for (let i = 0; i < data.simulation.length; i++) {
    const dayData = data.simulation[i];
    const dayCalculated = last(game.simulation.modelStates);

    if (!isEqual(dayData, dayCalculated)) {
      console.error(`Validation failed for ${dayData.date}`, dayData, dayCalculated);
      if (breakImmediately) return;
      else res = false;
    }

    if (i < data.simulation.length - 1) {
      game.moveForward(data.simulation[i + 1].randomness);
    }
  }

  if (!res) console.error(`Validation failed, new data: ${JSON.stringify(game.simulation.modelStates, null, 2)}`);

  // Set the real scenario for the future gameplay mitigations
  game.scenario = new Scenario(data.scenario.dates, data.scenario.gameplayMitigationHistory);
  return game;
}
