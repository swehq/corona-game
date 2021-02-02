import {isEqualWith, isNumber, last} from 'lodash';
import {Game, GameData} from './game';
import {ScenarioName} from './scenario';
import {dateDiff} from './utils';

export type Validity = 'valid' | 'incorrect-numbers' | 'lost-stability' | 'too-short' | 'too-long' | 'bad-structure';
type ValidationResult = {validity: Validity, game?: Game};

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

export function validateGame(data: GameData, breakImmediately = true): ValidationResult {
  let game: Game;
  let scenarioName: ScenarioName;
  const res: ValidationResult = {validity: 'valid'};

  try {
    scenarioName = data.scenarioName || 'czechiaGame';

    game = new Game(scenarioName, data.randomSeed);
    res.game = game;

    const scenarioDuration = 1 + dateDiff(game.scenario.dates.endDate, game.scenario.dates.rampUpStartDate);
    if (data.simulation.length > scenarioDuration) {
      if (breakImmediately) return {...res, validity: 'too-long'};
      res.validity = 'too-long';
    }

    game.mitigationParams = data.mitigations.params;
    game.mitigationHistory = data.mitigations.history;
    game.eventChoices = data.eventChoices;
    game.mitigationControlChanges = data.mitigations.controlChanges;

    for (let i = 0; i < data.simulation.length; i++) {
      const dayData = data.simulation[i];
      const dayCalculated = last(game.simulation.modelStates);

      if (!isEqualWith(dayData, dayCalculated, upToEpsilonCustomizer)) {
        if (breakImmediately) return {...res, validity: 'incorrect-numbers'};
        res.validity = 'incorrect-numbers';
      }

      if (i < data.simulation.length - 1) {
        game.applyMitigationsFromHistory();
        game.moveForward();
      }
    }

    if (res.validity === 'valid') {
      if (!game.isFinished()) return {...res, validity: 'too-short'};
      if (game.isGameLost()) return {...res, validity: 'lost-stability'};
    }
  } catch (e) {
    return {...res, validity: 'bad-structure'};
  }

  return res;
}
