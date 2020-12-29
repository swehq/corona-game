import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Observable} from 'rxjs';
import {map, shareReplay, startWith} from 'rxjs/operators';
import {Game} from 'src/app/services/game';
import {MitigationPair} from 'src/app/services/scenario';
import {GameService} from '../game.service';

export type MitigationsPresetLevel = 'open' | 'level1' | 'level2' | 'lockdown';

export type EventsLevel = false | 1000 | 100 | 10;
export type BusinessesLevel = false | 'some' | 'most';
export type SchoolsLevel = false | 'universities' | 'all';

export interface Mitigations {
  rrr: boolean;
  stayHome: boolean;
  bordersClosed: boolean;
  events: EventsLevel;
  businesses: BusinessesLevel;
  schools: SchoolsLevel;
}

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
  });

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
  };

  readonly value$: Observable<Mitigations>;

  constructor(gameService: GameService) {
    this.formGroup.setValue(Game.defaultMitigations);
    this.value$ = this.formGroup.valueChanges.pipe(
      startWith(this.formGroup.value),
      map(val => val as {[key in keyof Mitigations]: any}),
      shareReplay(1),
    );

    this.value$
      .pipe(untilDestroyed(this))
      .subscribe((m: Mitigations) => gameService.game.setMitigations(m));

    gameService.reset$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.formGroup.setValue(gameService.game.mitigations));
  }

  preset(level: MitigationsPresetLevel) {
    switch (level) {
      case 'open':
        this.set(Game.defaultMitigations);
        return;

      case 'level1':
        this.set({
          ...Game.defaultMitigations,
          events: 1000,
          rrr: true,
        });
        return;

      case 'level2':
        this.set({
          ...Game.defaultMitigations,
          events: 100,
          rrr: true,
          businesses: 'some',
          schools: 'universities',
        });
        return;

      case 'lockdown':
        this.set({
          ...Game.defaultMitigations,
          events: 10,
          rrr: true,
          businesses: 'most',
          schools: 'all',
          stayHome: true,
        });
        return;

      default:
        throw new Error(`Undefined MitigationsLevel ${level}`);
    }
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
