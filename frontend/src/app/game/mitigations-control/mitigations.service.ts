import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {isEqual} from 'lodash';
import {Observable} from 'rxjs';
import {debounceTime, map, pairwise, shareReplay, startWith, tap} from 'rxjs/operators';
import {Game} from '../../services/game';
import {MitigationPair} from '../../services/scenario';
import {GameService} from '../game.service';

export type MitigationsPresetLevel = 'open' | 'level1' | 'level2';

export type EventsLevel = false | 1000 | 100 | 10;
export type BusinessesLevel = false | 'some' | 'most';
export type SchoolsLevel = false | 'universities' | 'all';

export interface Mitigations {
  bordersClosed: boolean;
  businesses: BusinessesLevel;
  businessesCompensation: boolean;
  events: EventsLevel;
  eventsCompensation: boolean;
  rrr: boolean;
  schools: SchoolsLevel;
  schoolsCompensation: boolean;
  stayHome: boolean;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class MitigationsService {
  formGroup = new FormGroup({
    bordersClosed: new FormControl(),
    businesses: new FormControl(),
    businessesCompensation: new FormControl(),
    events: new FormControl(),
    eventsCompensation: new FormControl(),
    rrr: new FormControl(),
    schools: new FormControl(),
    schoolsCompensation: new FormControl(),
    stayHome: new FormControl(),
  });

  static readonly mitigationsI18n: { [key in keyof Mitigations]: Record<string, string> } = {
    bordersClosed: {
      true: 'Hranice - zavřené',
      false: 'Hranice - otevřené',
    },
    businesses: {
      some: 'Služby - zavřené rizikové',
      most: 'Služby - otevřené jen základní',
      false: 'Služby - neomezeno',
    },
    businessesCompensation: {
      true: 'Nekompenzovat živnostníky',
      false: 'Kompenzace živnostníkům',
    },
    events: {
      1000: 'Akce - max. 1 000',
      100: 'Akce - max. 100',
      10: 'Akce - max. 10',
      false: 'Akce - neomezeno',
    },
    eventsCompensation: {
      true: 'Nekompenzovat pohostinství',
      false: 'Kompenzace pohostinství',
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
    schoolsCompensation: {
      true: 'Nezavést ošetřovné',
      false: 'Zavést ošetřovné',
    },
    stayHome: {
      true: 'Zákaz vycházení',
      false: 'Vycházení neomezeno',
    },
  };

  readonly value$: Observable<Mitigations>;

  constructor(gameService: GameService) {
    this.formGroup.setValue(Game.defaultMitigations);

    const _value$ = this.formGroup.valueChanges.pipe(
      startWith(this.formGroup.value),
      map(val => val as {[key in keyof Mitigations]: any}),
    );

    this.value$ = _value$.pipe(
      debounceTime(0),
      shareReplay(1),
    );

    const changes$ = _value$.pipe(
      pairwise(),
      map(([oldValue, newValue]) => {
        const keys = Object.keys(newValue) as (keyof Mitigations)[];
        const changed = keys.filter(key => !isEqual(oldValue[key], newValue[key]));
        return {oldValue, newValue, changed};
      }),
    );

    changes$.pipe(
      untilDestroyed(this),
    ).subscribe(
      ({newValue, changed}) => {
        if (changed.includes('businesses') && newValue.businesses === false) {
          this.force('businessesCompensation', false, newValue);
        }

        if (changed.includes('businesses') && newValue.businesses !== 'most') {
          this.force('stayHome', false, newValue);
        }

        if (changed.includes('businessesCompensation') && newValue.businessesCompensation) {
          this.force('businesses', ['some', 'most'], newValue);
        }

        if (changed.includes('events') && newValue.events === false) {
          this.force('eventsCompensation', false, newValue);
        }

        if (changed.includes('events') && newValue.events !== 10) {
          this.force('stayHome', false, newValue);
        }

        if (changed.includes('eventsCompensation') && newValue.eventsCompensation) {
          this.force('events', [1000, 100, 10], newValue);
        }

        if (changed.includes('rrr') && newValue.rrr === false) {
          this.force('stayHome', false, newValue);
        }

        if (changed.includes('schools') && newValue.schools !== 'all') {
          this.force('schoolsCompensation', false, newValue);
          this.force('stayHome', false, newValue);
        }

        if (changed.includes('schoolsCompensation') && newValue.schoolsCompensation) {
          this.force('schools', 'all', newValue);
        }

        if (changed.includes('stayHome') && newValue.stayHome) {
          this.force('businesses', 'most', newValue);
          this.force('events', 10, newValue);
          this.force('rrr', true, newValue);
          this.force('schools', 'all', newValue);
        }
      },
    );

    this.value$
      .pipe(untilDestroyed(this))
      .subscribe(mitigations => gameService.game.applyMitigationActions({mitigations}));

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

      default:
        throw new Error(`Undefined MitigationsLevel ${level}`);
    }
  }

  set(mitigations: Mitigations) {
    this.formGroup.setValue(mitigations);
  }

  force<K extends keyof Mitigations, V extends Mitigations[K]>(
    mitigation: K,
    enabledValues: V | V[],
    referenceMitigations = this.formGroup.getRawValue(),
  ) {
    enabledValues = (Array.isArray(enabledValues) ? enabledValues : [enabledValues]) as V[];
    const currentValue = referenceMitigations[mitigation];

    if (enabledValues.includes(currentValue)) return;

    const patch: Partial<Mitigations> = {};
    patch[mitigation] = enabledValues[0];
    this.formGroup.patchValue(patch);
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
          ['most', 'Jen základní'],
        ];

      default:
        throw new Error(`No options defined for mitigation param ${paramName}`);
    }
  }

  getLabel(variable: keyof Mitigations, value: any) {
    return MitigationsService.mitigationsI18n[variable][String(value)];
  }
}
