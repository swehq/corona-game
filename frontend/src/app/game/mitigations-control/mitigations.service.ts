import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Observable} from 'rxjs';
import {map, shareReplay, startWith} from 'rxjs/operators';
import {EventHandler} from '../../services/events';
import {Game, Mitigations, MitigationsPresetLevel, mitigationPresets} from '../../services/game';
import {MitigationPair} from '../../services/scenario';
import {GameService} from '../game.service';
import {isEqual} from 'lodash';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class MitigationsService {
  formGroup = new FormGroup({
    bordersClosed: new FormControl(),
    businesses: new FormControl(),
    events: new FormControl(),
    rrr: new FormControl(),
    schools: new FormControl(),
    stayHome: new FormControl(),
    eventsCompensation: new FormControl(),
    businessesCompensation: new FormControl(),
    schoolsCompensation: new FormControl(),
  });

  gameService: GameService;

  static readonly mitigationsI18n: {[key in keyof Mitigations]: Record<string, string>} = {
    bordersClosed: {
      true: 'Hranice - zavřené',
      false: 'Hranice - otevřené',
    },
    businesses: {
      some: 'Služby - zavřené rizikové',
      most: 'Služby - otevřené jen základní',
      false: 'Služby - neomezeno',
    },
    events: {
      1000: 'Akce - max. 1 000',
      100: 'Akce - max. 100',
      10: 'Akce - max. 10',
      false: 'Akce - neomezeno',
    },
    rrr: {
      true: '3R - zavedeno',
      false: '3R - zrušeno',
    },
    schools: {
      universities: 'Školy - zavřené univerzity',
      all: 'Školy - zavřené všechny',
      false: 'Školy - neomezeno',
    },
    stayHome: {
      true: 'Zákaz vycházení',
      false: 'Vycházení neomezeno',
    },
    eventsCompensation: {
      true: 'Nekompenzovat pohostinství',
      false: 'Kompenzace pohostinství',
    },
    businessesCompensation: {
      true: 'Nekompenzovat živnostníky',
      false: 'Kompenzace živnostníkům',
    },
    schoolsCompensation: {
      true: 'Nezavést ošetřovné',
      false: 'Zavést ošetřovné',
    },
  };

  readonly value$: Observable<Mitigations>;

  constructor(gameService: GameService) {
    this.gameService = gameService;
    this.formGroup.setValue(Game.defaultMitigations);
    this.value$ = this.formGroup.valueChanges.pipe(
      startWith(this.formGroup.value),
      map(val => val as {[key in keyof Mitigations]: any}),
      shareReplay(1),
    );

    this.value$
      .pipe(untilDestroyed(this))
      .subscribe((m: Mitigations) => {
        gameService.game.applyMitigationActions({mitigations: m});
        // Change the form state to match game state asychronously
        if (!isEqual(m, gameService.game.mitigations)) {
          window.setTimeout(() => this.formGroup.setValue(gameService.game.mitigations), 1);
        }
      });

    gameService.reset$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.formGroup.setValue(gameService.game.mitigations));
  }

  preset(level: MitigationsPresetLevel) {
    this.set({
      ...Game.defaultMitigations,
      ...mitigationPresets[level],
    });
  }

  oneTimeCompensation() {
    const mitigation = {
      ...EventHandler.defaultMitigation,
      id: 'one-time-compensation',
      timeout: 1,
      cost: 50_000_000_000,
      stabilityCost: -5,
    };
    this.gameService.game.applyMitigationActions({eventMitigations: [mitigation]});
  }

  set(mitigations: Mitigations) {
    this.formGroup.setValue(mitigations);
  }

  optionsFor<T extends MitigationPair>(paramName: T[0]): [value: T[1], label: string][] {
    switch (paramName) {
      case 'events':
        return [
          [false, 'Neomezeno'],
          [1000, 'Max. 1 000'],
          [100, 'Max. 100'],
          [10, 'Max. 10'],
        ];

      case 'schools':
        return [
          [false, 'Neomezeno'],
          ['universities', 'Zavřít univerzity'],
          ['all', 'Zavřít všechny'],
        ];

      case 'businesses':
        return [
          [false, 'Neomezeno'],
          ['some', 'Zavřít rizikové'],
          ['most', 'Otevřené jen základní'],
        ];

      default:
        throw new Error(`No options defined for mitigation param ${paramName}`);
    }
  }

  getLabel(variable: keyof Mitigations, value: any) {
    return MitigationsService.mitigationsI18n[variable][String(value)];
  }
}
