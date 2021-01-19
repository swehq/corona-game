import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {isEqual} from 'lodash';
import {merge, Observable, OperatorFunction, Subject} from 'rxjs';
import {delay, filter, map, pairwise, shareReplay, startWith, withLatestFrom} from 'rxjs/operators';
import {Game} from './game';
import {MitigationPair} from './scenario';
import {GameService} from '../game/game.service';

export type MitigationsPresetLevel = 'open' | 'level1' | 'level2';

export type EventsLevel = false | 1000 | 100 | 10;
export type BusinessesLevel = false | 'some' | 'most';
export type SchoolsLevel = false | 'universities' | 'all';

export interface Mitigations {
  bordersClosed: boolean;
  businesses: BusinessesLevel;
  events: EventsLevel;
  rrr: boolean;
  schools: SchoolsLevel;
  stayHome: boolean;
  compensations: boolean;
}

type MitigationKey = keyof Mitigations;
type PresetValue = [MitigationsPresetLevel | 'reset', Mitigations];

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
    events: new FormControl(),
    rrr: new FormControl(),
    schools: new FormControl(),
    stayHome: new FormControl(),
    compensations: new FormControl(),
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
      universities: 'Školy - zavřené vysoké',
      all: 'Školy - zavřené všechny',
      false: 'Školy - neomezeno',
    },
    stayHome: {
      true: 'Zákaz vycházení',
      false: 'Vycházení neomezeno',
    },
    compensations: {
      false: 'Žádné finanční kompenzace',
      true: 'Finanční kompenzace',
    },
  };

  private dailyDiff: MitigationDiff = {
    oldValue: this.gameService.game.mitigations,
    newValue: this.gameService.game.mitigations,
    changed: [],
  };
  private setValue$ = new Subject<PresetValue>();
  private modelIsChanging = false;

  readonly value$: Observable<Mitigations>;
  readonly presetApplied$ = this.setValue$.asObservable(); // preset() or reset$
  readonly uiChanges$: Observable<MitigationDiff>; // from user actions
  readonly enforcedChanges$: Observable<MitigationDiff>; // from enforceChanges() logic
  readonly setChanges$: Observable<MitigationDiff>; // from preset() and reset$
  readonly changes$: Observable<MitigationDiff>; // all changes merged

  constructor(private gameService: GameService) {
    this.formGroup.setValue(Game.defaultMitigations);

    this.value$ = this.formGroup.valueChanges.pipe(
      startWith(this.gameService.game.mitigations),
      map(val => val as { [key in keyof Mitigations]: any }),
    );

    const calculateDiff: OperatorFunction<[Mitigations, Mitigations], MitigationDiff> =
      map(([oldValue, newValue]) => {
        const keys = Object.keys(newValue) as (keyof Mitigations)[];
        const changed = keys.filter(key => !isEqual(oldValue[key], newValue[key]));
        return {oldValue, newValue, changed};
      });

    this.uiChanges$ = this.value$.pipe(
      pairwise(),
      filter(() => !this.modelIsChanging),
      calculateDiff,
    );

    this.enforcedChanges$ = this.uiChanges$.pipe(
      delay(0), // critical! All observers of uiChanges$ must finish their callbacks first.
      map(diff => this.getEnforcedChanges(diff)),
      filter(diff => diff.changed.length > 0),
      shareReplay(1),
    );

    this.setChanges$ = this.setValue$.pipe(
      map(([_name, newValue]) => newValue),
      withLatestFrom(this.value$),
      map(([newValue, oldValue]) => [oldValue, newValue] as [Mitigations, Mitigations]),
      calculateDiff,
    );

    this.changes$ = merge(
      this.uiChanges$,
      this.enforcedChanges$,
      this.setChanges$,
    );

    this.changes$
      .pipe(untilDestroyed(this))
      .subscribe(diff => this.dailyDiff = {
        ...this.dailyDiff,
        newValue: diff.newValue,
        changed: [...this.dailyDiff.changed, ...diff.changed],
      });

    this.gameService.endOfDay$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        // remove duplicities
        let changed = [...new Set(this.dailyDiff.changed)];

        // remove mitigations finally changed back to oldValue
        const {oldValue, newValue} = this.dailyDiff;
        changed = changed.filter(key => !isEqual(oldValue[key], newValue[key]));

        this.gameService.game.saveMitigationControlChanges(
          changed.map(ch => MitigationsService.mitigationsI18n[ch][String(newValue[ch])]));

        this.dailyDiff = {
          ...this.dailyDiff,
          oldValue: this.dailyDiff.newValue,
          changed: [],
        };
      });

    this.enforcedChanges$
      .pipe(untilDestroyed(this))
      .subscribe(diff => this.set(diff.newValue));

    this.setValue$
      .pipe(
        startWith(['reset', gameService.game.mitigations] as PresetValue),
        untilDestroyed(this),
      ).subscribe(preset => this.set(preset[1]));

    gameService.reset$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.setValue$.next(['reset', gameService.game.mitigations]);
        this.dailyDiff = {
          oldValue: gameService.game.mitigations,
          newValue: gameService.game.mitigations,
          changed: [],
        };
      });

    this.value$
      .pipe(untilDestroyed(this))
      .subscribe(mitigations => gameService.game.applyMitigationActions({mitigations}));
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

    if (changed.includes('businesses') && newValue.businesses !== 'most') {
      force('stayHome', false);
    }

    if (changed.includes('events') && newValue.events !== 10) {
      force('stayHome', false);
    }

    if (changed.includes('rrr') && newValue.rrr === false) {
      force('stayHome', false);
    }

    if (changed.includes('schools') && newValue.schools !== 'all') {
      force('stayHome', false);
    }

    if (changed.includes('stayHome') && newValue.stayHome) {
      force('businesses', 'most');
      force('events', 10);
      force('rrr', true);
      force('schools', 'all');
    }
  }

  preset(level: MitigationsPresetLevel) {
    const presets: Record<MitigationsPresetLevel, Mitigations> = {
      open: {
        ...Game.defaultMitigations,
      },
      level1: {
        ...Game.defaultMitigations,
        events: 1000,
        rrr: true,
      },
      level2: {
        ...Game.defaultMitigations,
        events: 100,
        rrr: true,
        businesses: 'some',
        schools: 'universities',
      },
    };

    this.setValue$.next([level, presets[level]]);
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
