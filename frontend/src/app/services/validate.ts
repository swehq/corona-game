import {cloneDeep, isEqualWith, isNumber, last} from 'lodash';
import {Game, GameData} from './game';
import {ScenarioName} from './scenario';
import {dateDiff} from './utils';

export type Validity = 'valid' | 'incorrect-numbers' | 'lost-stability' | 'too-short' | 'too-long' | 'bad-structure'
  | 'valid-moved';

type ValidationResult = {validity: Validity, game?: Game};

const EPSILON = 1e-8;

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

function upToTwoCustomizer(value1: any, value2: any) {
  if (isNumber(value1) && isNumber(value2)) {
    return Math.abs(value1 - value2) <= 2;
  }
}

function gameDataIsEqualCustomizer(value1: any, value2: any) {
  if (value1.total === undefined || value1.totalUnrounded === undefined || value1.avg7Day === undefined) {
    return upToEpsilonCustomizer(value1, value2);
  }

  // Special handling of game statistics
  // all numbers are compared with "up to two" precision to cover maximal diff of two rounded numbers
  // unrounded values are compared up to epsilon
  return isEqualWith(value1, value2, upToTwoCustomizer)
    && upToEpsilonCustomizer(value1.totalUnrounded, value2.totalUnrounded) === true
    && value1.total === Math.round(value1.totalUnrounded)
    && value2.total === Math.round(value2.totalUnrounded);
}

// Complete missing data in a legacy game data (for backward compatibility)
function completeLegacyGameData(legacyData: GameData) {
  if (legacyData.mitigations.params[0]!.mutationExposedDrift !== undefined) {
    // Day state seems to be in up-to-date format
    return legacyData;
  }

  // Fill missing data
  const data: GameData = cloneDeep(legacyData);
  data.simulation.forEach(dayState => {
    const modelInputs = dayState.modelInputs;
    if (modelInputs) {
      modelInputs.mutationExposedDrift = 0;
    }

    const sirState = dayState.sirState;
    sirState.mutationExposed = 0;
    sirState.mutationInfectious = 0;
    sirState.mutationExposedNew = 0;
    sirState.mutationInfectiousNew = 0;
  });

  data.mitigations.params.forEach(m => {
    if (m.mutationExposedDrift === undefined) m.mutationExposedDrift = 0;
  });

  return data;
}

export function validateGame(data: GameData, breakImmediately = true): ValidationResult {
  let game: Game;
  let scenarioName: ScenarioName;
  const res: ValidationResult = {validity: 'valid'};

  try {
    data = completeLegacyGameData(data);
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

      if (!isEqualWith(dayData, dayCalculated, gameDataIsEqualCustomizer)) {
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
