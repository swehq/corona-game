import {cloneDeep, last} from 'lodash';
import {GameData} from 'src/app/services/game';
import {validateGame} from 'src/app/services/validate';
import realData from './data-czechia-real.json';

const data = realData as GameData;

describe('GameValidation', () => {
  it('should validate CZ real scenario', () => {
    expect(validateGame(data)).toBeTrue();
  });

  it('should not validate CZ scenario w/ added mitigation', () => {
    const modifiedData = cloneDeep(data);
    modifiedData.mitigations.history['2020-12-07'] = {mitigations: {schools: 'universities'}};
    expect(validateGame(modifiedData)).toBeFalse();
  });

  it('should not validate CZ scenario w/ modified dead state', () => {
    const modifiedData = cloneDeep(data);
    last(modifiedData.simulation)!.sirState.dead = last(data.simulation)!.sirState.dead + 1e-9;
    expect(validateGame(modifiedData)).toBeFalse();
  });

  it('should not validate CZ scenario w/ modified mortality randomness', () => {
    const modifiedData = cloneDeep(data);
    const randomnessToModify = modifiedData.simulation.find(s => s.date === '2020-10-10')!.randomness;
    randomnessToModify!.baseMortality += 1e-10;
    expect(validateGame(modifiedData)).toBeFalse();
  });

  it('should validate CZ scenario w/ added trivial event mitigation', () => {
    const modifiedData = cloneDeep(data);
    const eventMitigation = {
      timeout: 10,
      label: 'OK',
      rMult: 1,
      exposedDrift: 0,
      cost: 0,
      stabilityCost: 0,
      vaccinationPerDay: 0,
    };
    modifiedData.mitigations.history['2020-11-01'] = {eventMitigations: [eventMitigation]};
    expect(validateGame(modifiedData)).toBeTrue();
  });

  it('should not validate CZ scenario w/ added event mitigation', () => {
    const modifiedData = cloneDeep(data);
    const eventMitigation = {
      timeout: 10,
      label: 'rMult',
      rMult: 0.9,
      exposedDrift: 0,
      cost: 0,
      stabilityCost: 0,
      vaccinationPerDay: 0,
    };
    modifiedData.mitigations.history['2020-11-01'] = {eventMitigations: [eventMitigation]};
    expect(validateGame(modifiedData)).toBeFalse();
  });

 });
