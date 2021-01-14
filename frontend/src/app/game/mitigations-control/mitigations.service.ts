import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {isEqual} from 'lodash';
import {Observable} from 'rxjs';
import {delay, filter, map, pairwise, shareReplay, startWith} from 'rxjs/operators';
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

type MitigationKey = keyof Mitigations;

interface MitigationDiff {
  oldValue: Mitigations;
  newValue: Mitigations;
  changed: MitigationKey[];
}

type MitigationForceCallback =
  <K extends MitigationKey, V extends Mitigations[K]>
  (mitigation: K, enabledValues: V | V[]) => void;

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
      universities: 'Školy - zavřené vysoké',
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
  readonly uiChanges$: Observable<MitigationDiff>;
  readonly enforcedChanges$: Observable<MitigationDiff>;
  private modelIsChanging = false;

  constructor(gameService: GameService) {
    this.formGroup.setValue(Game.defaultMitigations);

    this.value$ = this.formGroup.valueChanges.pipe(
      startWith(this.formGroup.value),
      map(val => val as { [key in keyof Mitigations]: any }),
    );

    this.uiChanges$ = this.value$.pipe(
      pairwise(),
      filter(() => !this.modelIsChanging),
      map(([oldValue, newValue]) => {
        const keys = Object.keys(newValue) as (keyof Mitigations)[];
        const changed = keys.filter(key => !isEqual(oldValue[key], newValue[key]));
        return {oldValue, newValue, changed};
      }),
    );

    this.enforcedChanges$ = this.uiChanges$.pipe(
      delay(0), // critical! All observers of uiChanges$ must finish their callbacks first.
      map(diff => this.getEnforcedChanges(diff)),
      filter(diff => diff.changed.length > 0),
      shareReplay(1),
    );

    this.enforcedChanges$
      .pipe(untilDestroyed(this))
      .subscribe(diff => this.set(diff.newValue));

    this.value$
      .pipe(untilDestroyed(this))
      .subscribe(mitigations => gameService.game.applyMitigationActions({mitigations}));

    gameService.reset$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.formGroup.setValue(gameService.game.mitigations));
  }

  getEnforcedChanges(diff: MitigationDiff): MitigationDiff {

    // call projectChanges() to project changes to other mitigations
    const step = (from: MitigationDiff): MitigationDiff => {
      const newValue = {...from.newValue};
      const changed = new Set<MitigationKey>();
      const force: MitigationForceCallback = (mitigation, enabledValues) => {
        enabledValues = (Array.isArray(enabledValues) ? enabledValues : [enabledValues]);
        const currentValue = from.newValue[mitigation] as any;

        if (enabledValues.includes(currentValue)) return;

        newValue[mitigation] = enabledValues[0];
        changed.add(mitigation);
      };

      this.enforceChanges(from, force);

      return {oldValue: from.newValue, newValue, changed: Array.from(changed)};
    };

    // iterate until some change is forced
    const allChanged = new Set<MitigationKey>();
    let fromDiff: MitigationDiff;
    let nextDiff = diff;
    do {
      fromDiff = nextDiff;
      nextDiff = step(fromDiff);
      nextDiff.changed.forEach(key => allChanged.add(key));
    } while (nextDiff.changed.length);

    return {oldValue: diff.newValue, newValue: nextDiff.newValue, changed: Array.from(allChanged)};
  }

  enforceChanges(diff: MitigationDiff, force: MitigationForceCallback) {
    const {changed, newValue} = diff;

    if (changed.includes('businesses') && newValue.businesses === false) {
      force('businessesCompensation', false);
    }

    if (changed.includes('businesses') && newValue.businesses !== 'most') {
      force('stayHome', false);
    }

    if (changed.includes('businessesCompensation') && newValue.businessesCompensation) {
      force('businesses', ['some', 'most']);
    }

    if (changed.includes('events') && newValue.events === false) {
      force('eventsCompensation', false);
    }

    if (changed.includes('events') && newValue.events !== 10) {
      force('stayHome', false);
    }

    if (changed.includes('eventsCompensation') && newValue.eventsCompensation) {
      force('events', [1000, 100, 10]);
    }

    if (changed.includes('rrr') && newValue.rrr === false) {
      force('stayHome', false);
    }

    if (changed.includes('schools') && newValue.schools !== 'all') {
      force('schoolsCompensation', false);
      force('stayHome', false);
    }

    if (changed.includes('schoolsCompensation') && newValue.schoolsCompensation) {
      force('schools', 'all');
    }

    if (changed.includes('stayHome') && newValue.stayHome) {
      force('businesses', 'most');
      force('events', 10);
      force('rrr', true);
      force('schools', 'all');
    }
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
    this.modelIsChanging = true;
    this.formGroup.setValue(mitigations);
    this.modelIsChanging = false;
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
          ['universities', 'Zavřít vysoké'],
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
