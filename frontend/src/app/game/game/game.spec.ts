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
    modifiedData.mitigations.history['2020-12-07'] = {schools: 'universities'};
    expect(validateGame(modifiedData)).toBeFalse();
  });

  it('should not validate CZ scenario w/ modified dead state', () => {
    const modifiedData = cloneDeep(data);
    last(modifiedData.simulation)!.sirState.dead = 9739.3862570802; // 9739.3862570801
    expect(validateGame(modifiedData)).toBeFalse();
  });

  it('should not validate CZ scenario w/ modified mortality randomness', () => {
    const modifiedData = cloneDeep(data);
    const randomnessToModify = modifiedData.simulation.find(s => s.date === '2020-10-10')!.randomness;
    randomnessToModify!.baseMortality += 1e-10;
    expect(validateGame(modifiedData)).toBeFalse();
  });
});
