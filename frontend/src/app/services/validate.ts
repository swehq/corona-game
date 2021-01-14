import {isEqual, last} from 'lodash';
import {Game, GameData} from './game';
import {Scenario} from './scenario';

export function validateGame(data: GameData, breakImmediately = true): boolean {
  // TODO add test of randomness params (expected distribution or element of interval at least)
  // TODO validate game length, end date
  if (!data.simulation.length) return false;

  let res = true;
  const firstDay = data.simulation[0].date;
  const lastDay = last(data.simulation)!.date;

  const scenario = new Scenario({
    rampUpStartDate: firstDay,
    rampUpEndDate: firstDay,
    endDate: lastDay,
  }, data.mitigations.history);
  const game = new Game(scenario);
  game.mitigationParams = data.mitigations.params;

  for (let i = 0; i < data.simulation.length; i++) {
    const dayData = data.simulation[i];
    const dayCalculated = last(game.simulation.modelStates);

    if (!isEqual(dayData, dayCalculated)) {
      console.error(`Validation failed for ${dayData.date}`, dayData, dayCalculated);
      if (breakImmediately) return false;
      else res = false;
    }

    if (i < data.simulation.length - 1) {
      game.moveForward(data.simulation[i + 1].randomness);
    }
  }

  if (!res) console.error(`Validation failed, new data: ${JSON.stringify(game.simulation.modelStates, null, 2)}`);

  return true;
}
