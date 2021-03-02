import {cloneDeep, last} from 'lodash';
import {Game, GameData} from 'src/app/services/game';
import {validateGame, Validity} from 'src/app/services/validate';

import jsonValidLegacy from './data/data-valid-legacy.json';
import jsonDataTooLong from './data/data-too-long.json';
import jsonDataLostStability from './data/data-lost-stability.json';

// source data others are created out of (easiest for maintanance)
const dataTooLong = jsonDataTooLong as GameData;
const dataValid = cloneDeep(dataTooLong);
dataValid.simulation.pop();

describe('GameValidation', () => {
  it('should validate CZ real scenario', () => {
    expect(validateGame(dataValid).validity).toBe('valid');
  });

  it('should validate legacy data', () => {
    expect(validateGame(jsonValidLegacy as any).validity).toBe('valid');
  });

  it('should get proper validation results', async () => {
    const dataLostStability = jsonDataLostStability;
    const dataTooShort = cloneDeep(dataValid);
    dataTooShort.simulation.pop();
    const dataEmpty = cloneDeep(dataValid);
    dataEmpty.simulation = [];
    const dataIncorrectNumbers = cloneDeep(dataValid);
    last(dataIncorrectNumbers.simulation)!.stats.deaths.totalUnrounded += 1e-3;
    const dataIncorrectNumbersShort = cloneDeep(dataValid);
    dataIncorrectNumbersShort.simulation.splice(1);
    dataIncorrectNumbersShort.simulation[0].sirState.suspectible++;

    const inputs: {validity: Validity, data: any}[] = [
      {validity: 'valid', data: dataValid},
      {validity: 'incorrect-numbers', data: dataIncorrectNumbers},
      {validity: 'incorrect-numbers', data: dataIncorrectNumbersShort},
      {validity: 'too-short', data: dataTooShort},
      {validity: 'too-short', data: dataEmpty},
      {validity: 'bad-structure', data: {}},
      {validity: 'lost-stability', data: dataLostStability},
      {validity: 'too-long', data: dataTooLong},
    ];

    for (const input of inputs) {
      expect(validateGame(input.data as GameData).validity).toBe(input.validity);
      expect(validateGame(input.data as GameData, false).validity).toBe(input.validity);
    }
  });

  it('should not validate CZ scenario w/ added mitigation', () => {
    const modifiedData = cloneDeep(dataValid);
    modifiedData.mitigations.history['2020-12-07'] = {mitigations: {schools: 'all'}};
    expect(validateGame(modifiedData).validity).toBe('incorrect-numbers');
  });

  it('should not validate CZ scenario w/ modified dead state', () => {
    const modifiedData = cloneDeep(dataValid);
    last(modifiedData.simulation)!.sirState.dead += 1e-3;
    expect(validateGame(modifiedData).validity).toBe('incorrect-numbers');
  });

  it('should not validate CZ scenario w/ modified mortality randomness', () => {
    const modifiedData = cloneDeep(dataValid);
    const randomnessToModify = modifiedData.simulation.find(s => s.date === '2020-10-10')!.randomness;
    randomnessToModify!.baseMortality += 1e-6;
    expect(validateGame(modifiedData).validity).toBe('incorrect-numbers');
  });

  it('should validate CZ scenario w/ added trivial event mitigation', () => {
    const modifiedData = cloneDeep(dataValid);
    const eventMitigation = {
      duration: 10,
      rMult: 1,
      exposedDrift: 0,
      stabilityCost: 0,
      vaccinationPerDay: 0,
    };
    modifiedData.mitigations.history['2020-11-01'] = {eventMitigations: [eventMitigation]};
    expect(validateGame(modifiedData).validity).toBe('valid');
  });

  it('should not validate CZ scenario w/ added event mitigation', () => {
    const modifiedData = cloneDeep(dataValid);
    const eventMitigation = {
      duration: 10,
      label: 'rMult',
      rMult: 0.9,
      exposedDrift: 0,
      stabilityCost: 0,
      vaccinationPerDay: 0,
    };
    modifiedData.mitigations.history['2020-11-01'] = {eventMitigations: [eventMitigation]};
    expect(validateGame(modifiedData).validity).toBe('incorrect-numbers');
  });

 });

describe('EventInterpolationTests', () => {
  it('all event strings should interpolate', () => {
    const dayStats = dataValid.simulation.find(s => s.date === '2020-12-01');
    expect(dayStats).toBeDefined();

    /*
    TODO need check translated files
    eventTriggers.forEach(et => {
      et.events.forEach(ed => {
        const event = EventHandler.eventFromDef(ed);
        expect(event.title.indexOf('{{')).toBeLessThan(0);
        if (event.text) {
          expect(event.text.indexOf('{{')).toBeLessThan(0);
        }
        if (event.help) {
          expect(event.help.indexOf('{{')).toBeLessThan(0);
        }
      });
    });
    */
  });
});

describe('MitigationsTests', () => {
  it('should handle a sequence of event mitigations', () => {
    const game = new Game('czechiaGame');
    expect(game.eventMitigations.length).toEqual(0);

    // Add one event mitigation with infinite timeout
    game.applyMitigationActions({eventMitigations: [{duration: Infinity}]});
    game.moveForward();
    expect(game.eventMitigations.length).toEqual(1);

    // Add mitigation with timeout 5
    game.applyMitigationActions({eventMitigations: [{duration: 5}]});
    for (let i = 0; i < 5; i++) game.moveForward();
    expect(game.eventMitigations.length).toEqual(2);

    game.moveForward();
    expect(game.eventMitigations.length).toEqual(1);

    // test mitigations with ID
    game.applyMitigationActions({eventMitigations: [{id: 'test', duration: 5}]});
    game.applyMitigationActions({eventMitigations: [{id: 'test', duration: 5}]});
    game.applyMitigationActions({eventMitigations: [{id: 'test', duration: 5}]});
    game.moveForward();
    expect(game.eventMitigations.length).toEqual(2);

    // Cancel mitigation with ID
    game.applyMitigationActions({eventMitigations: [{id: 'test', duration: 0}]});
    game.moveForward();
    expect(game.eventMitigations.length).toEqual(1);

    // Test mitigation removal
    game.applyMitigationActions({eventMitigations: [{id: 'test', duration: 5}]});
    game.moveForward();
    expect(game.eventMitigations.length).toEqual(2);
    game.applyMitigationActions({removeMitigationIds: ['test']});
    game.moveForward();
    expect(game.eventMitigations.length).toEqual(1);
  });
});
