import {isEqualWith, isNumber, last} from 'lodash';
import {Event, EventAndChoice, EventMitigation} from './events';
import {Game, GameData} from './game';
import {ScenarioName} from './scenario';
import {dateDiff, nextDay} from './utils';

export type Validity = 'valid' | 'incorrect-numbers' | 'incorrect-choice' | 'incorrect-event-mitigation'
  | 'lost-stability' | 'too-short' | 'too-long' | 'bad-structure';
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

function isEqualUpToEpsilon(value1: any, value2: any) {
  return isEqualWith(value1, value2, upToEpsilonCustomizer);
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
      res.validity = 'too-long';
      if (breakImmediately) return res;
    }

    game.mitigationParams = data.mitigations.params;
    game.mitigationHistory = data.mitigations.history;
    game.eventChoices = data.eventChoices;
    game.mitigationControlChanges = data.mitigations.controlChanges;

    for (let i = 0; i < data.simulation.length; i++) {
      const dayData = data.simulation[i];
      const dayCalculated = last(game.simulation.modelStates);

      if (!isEqualUpToEpsilon(dayData, dayCalculated)) {
        res.validity = 'incorrect-numbers';
        if (breakImmediately) return res;
      }

      if (i < data.simulation.length - 1) {
        const nextDate = nextDay(game.simulation.lastDate);
        if (!validateEventMitigations(data.mitigations.history[nextDate]?.eventMitigations,
          data.eventChoices[nextDate])) {
          res.validity = 'incorrect-event-mitigation';
          if (breakImmediately) return res;
        }
        game.applyMitigationsFromHistory();

        const gameUpdate = game.moveForward();
        if (i < data.simulation.length - 2) {
          const expectedEvents =
            game.simulation.lastDate < game.scenario.dates.rampUpEndDate ? undefined : gameUpdate.events;
          if (!validateEventChoices(data.eventChoices[nextDay(game.simulation.lastDate)], expectedEvents)) {
            res.validity = 'incorrect-choice';
            if (breakImmediately) return res;
          }
        }
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

function validateEventMitigations(eventMitigations?: EventMitigation[], eventAndChoices?: EventAndChoice[]) {
  let expectedMitigations: EventMitigation[] = [];
  if (eventAndChoices) {
    eventAndChoices.forEach(enc => {
      if (enc.choice?.mitigations) expectedMitigations = expectedMitigations.concat(enc.choice!.mitigations);
    });
  }

  if (!eventMitigations) return expectedMitigations.length === 0;
  return isEqualUpToEpsilon(eventMitigations, expectedMitigations);
}

function eventHasMitigations(event: Event) {
  if (!event.choices) return false;

  return 0 < event.choices.reduce((count, c) => count + (c.mitigations ? c.mitigations.length : 0), 0);
}

function validateEventChoices(eventAndChoices?: EventAndChoice[], events?: Event[]) {
  const eventAndChoiceValues: EventAndChoice[] = eventAndChoices ? eventAndChoices : [];
  const eventValues: Event[] = events ? events : [];
  let eventAndChoiceIdx = 0;
  let eventIdx = 0;

  while (eventAndChoiceIdx < eventAndChoiceValues.length || eventIdx < eventValues.length) {
    // Skip events that have no mitigations
    while (eventAndChoiceIdx < eventAndChoiceValues.length
      && !eventHasMitigations(eventAndChoiceValues[eventAndChoiceIdx].event)) {
      eventAndChoiceIdx++;
    }
    while (eventIdx < eventValues.length
      && !eventHasMitigations(eventValues[eventIdx])) {
      eventIdx++;
    }

    // Check if choice is valid
    if (eventAndChoiceIdx < eventAndChoiceValues.length && eventIdx < eventValues.length) {
      const choice = eventAndChoiceValues[eventAndChoiceIdx].choice;
      if (!choice) return false;
      const choiceMitigations = choice.mitigations;
      const choices = eventValues[eventIdx].choices;
      if (!choices) return false; // Should not happen
      let isValid = false;
      choices.forEach(c => {
        if (isEqualUpToEpsilon(c.mitigations, choiceMitigations)) isValid = true;
      });

      if (!isValid) return false;
      eventAndChoiceIdx++;
      eventIdx++;
    } else if (eventAndChoiceIdx === eventAndChoiceValues.length || eventIdx === eventValues.length) {
      break;
    }
  }

  return eventAndChoiceIdx === eventAndChoiceValues.length && eventIdx === eventValues.length;
}
