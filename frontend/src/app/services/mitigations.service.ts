import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {isEqual} from 'lodash';
import {merge, Observable, OperatorFunction, Subject} from 'rxjs';
import {delay, filter, map, pairwise, shareReplay, startWith, withLatestFrom} from 'rxjs/operators';
import {MitigationPair} from './scenario';
import {defaultMitigations, Mitigations} from './mitigations';
import {GameService} from '../game/game.service';
import {marker as _} from '@biesbjerg/ngx-translate-extract-marker';

export type MitigationsPresetLevel = 'open' | 'level1' | 'level2';

export type MitigationKey = keyof Mitigations;
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
    testing: new FormControl(),
    businesses: new FormControl(),
    events: new FormControl(),
    rrr: new FormControl(),
    schools: new FormControl(),
    industry: new FormControl(),
    stayHome: new FormControl(),
    compensations: new FormControl(),
  });

  static readonly mitigationsI18n: { [key in keyof Mitigations]: Record<string, string> } = {
    bordersClosed: {
      true: _('Hranice - zavřené'),
      false: _('Hranice - otevřené'),
    },
    testing: {
      true: _('Testování zaměstnanců - začátek'),
      false: _('Testování zaměstnanců - konec'),
    },
    businesses: {
      some: _('Služby - zavřené rizikové'),
      most: _('Služby - otevřené jen základní'),
      false: _('Služby - neomezeno'),
    },
    events: {
      1000: _('Akce - max. 1 000'),
      100: _('Akce - max. 100'),
      10: _('Akce - max. 10'),
      false: _('Akce - neomezeno'),
    },
    rrr: {
      true: _('3R - zavedeno'),
      false: _('3R - zrušeno'),
    },
    schools: {
      universities: _('Školy - zavřené vysoké'),
      all: _('Školy - zavřené všechny'),
      false: _('Školy - neomezeno'),
    },
    industry: {
      reduce50: _('Průmysl - omezeno 50%'),
      reduce25: _('Průmysl - omezeno 25%'),
      false: _('Průmysl - neomezen'),
    },
    stayHome: {
      true: _('Zákaz vycházení'),
      false: _('Vycházení neomezeno'),
    },
    compensations: {
      false: _('Žádné finanční kompenzace'),
      true: _('Finanční kompenzace'),
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
    this.formGroup.setValue(defaultMitigations);

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

    if (changed.includes('industry') && newValue.industry !== 'reduce50') {
      force('stayHome', false);
    }

    if (changed.includes('stayHome') && newValue.stayHome) {
      force('businesses', 'most');
      force('events', 10);
      force('rrr', true);
      force('schools', 'all');
      if (this.hasIndustryMitigation) force('industry', 'reduce50');
    }
  }

  preset(level: MitigationsPresetLevel) {
    const defaultMitigationsKeepCompensations = {
      ...defaultMitigations,
      compensations: this.gameService.game.mitigations.compensations,
    };
    const presets: Record<MitigationsPresetLevel, Mitigations> = {
      open: {
        ...defaultMitigationsKeepCompensations,
      },
      level1: {
        ...defaultMitigationsKeepCompensations,
        events: 1000,
        rrr: true,
      },
      level2: {
        ...defaultMitigationsKeepCompensations,
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
          [false, _('Neomezeno')],
          [1000, _('Max. 1 000')],
          [100, _('Max. 100')],
          [10, _('Max. 10')],
        ];

      case 'schools':
        return [
          [false, _('Neomezeno')],
          ['universities', _('Zavřít vysoké')],
          ['all', _('Zavřít všechny')],
        ];

      case 'businesses':
        return [
          [false, _('Neomezeno')],
          ['some', _('Zavřít rizikové')],
          ['most', _('Jen základní')],
        ];

      case 'industry':
        return [
          [false, _('Neomezen')],
          ['reduce25', _('Omezit 25%')],
          ['reduce50', _('Omezit 50%')],
        ];

      default:
        throw new Error(`No options defined for mitigation param ${paramName}`);
    }
  }

  getLabel(variable: keyof Mitigations, value: any) {
    return MitigationsService.mitigationsI18n[variable][String(value)];
  }

  get hasIndustryMitigation() {
    return this.gameService.game.scenario.hasIndustryMitigation;
  }
}
