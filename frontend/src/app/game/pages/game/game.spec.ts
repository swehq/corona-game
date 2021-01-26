import {cloneDeep, last} from 'lodash-es';
import {EventHandler} from 'src/app/services/events';
import {eventTriggers} from 'src/app/services/event-list';
import {Game, GameData} from 'src/app/services/game';
import {validateGame} from 'src/app/services/validate';
import realData from './data-czechia-real.json';

const data = realData as GameData;

describe('GameValidation', () => {
  it('should validate CZ real scenario', () => {
    expect(validateGame(data)).toBeTruthy();
  });

  it('should not validate CZ scenario w/ added mitigation', () => {
    const modifiedData = cloneDeep(data);
    modifiedData.mitigations.history['2020-12-07'] = {mitigations: {schools: 'all'}};
    expect(validateGame(modifiedData)).toBeFalsy();
  });

  it('should not validate CZ scenario w/ modified dead state', () => {
    const modifiedData = cloneDeep(data);
    last(modifiedData.simulation)!.sirState.dead += 1e-9;
    expect(validateGame(modifiedData)).toBeFalsy();
  });

  it('should not validate CZ scenario w/ modified mortality randomness', () => {
    const modifiedData = cloneDeep(data);
    const randomnessToModify = modifiedData.simulation.find(s => s.date === '2020-10-10')!.randomness;
    randomnessToModify!.baseMortality += 1e-9;
    expect(validateGame(modifiedData)).toBeFalsy();
  });

  it('should validate CZ scenario w/ added trivial event mitigation', () => {
    const modifiedData = cloneDeep(data);
    const eventMitigation = {
      duration: 10,
      rMult: 1,
      exposedDrift: 0,
      stabilityCost: 0,
      vaccinationPerDay: 0,
    };
    modifiedData.mitigations.history['2020-11-01'] = {eventMitigations: [eventMitigation]};
    expect(validateGame(modifiedData)).toBeTruthy();
  });

  it('should not validate CZ scenario w/ added event mitigation', () => {
    const modifiedData = cloneDeep(data);
    const eventMitigation = {
      duration: 10,
      label: 'rMult',
      rMult: 0.9,
      exposedDrift: 0,
      stabilityCost: 0,
      vaccinationPerDay: 0,
    };
    modifiedData.mitigations.history['2020-11-01'] = {eventMitigations: [eventMitigation]};
    expect(validateGame(modifiedData)).toBeFalsy();
  });

 });

describe('EventInterpolationTests', () => {
  it('all event strings should interpolate', () => {
    const dayStats = data.simulation.find(s => s.date === '2020-12-01');
    expect(dayStats).toBeDefined();

    eventTriggers.forEach(et => {
      et.events.forEach(ed => {
        const event = EventHandler.eventFromDef(ed, dayStats);
        expect(event.title.indexOf('{{')).toBeLessThan(0);
        if (event.text) {
          expect(event.text.indexOf('{{')).toBeLessThan(0);
        }
        if (event.help) {
          expect(event.help.indexOf('{{')).toBeLessThan(0);
        }
      });
    });
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
