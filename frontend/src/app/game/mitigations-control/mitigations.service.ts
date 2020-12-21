import {Injectable} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {map, shareReplay, startWith} from 'rxjs/operators';

export type MitigationsPresetLevel = 'open' | 'level1' | 'level2' | 'lockdown';

export type EventsLevel = null | 'events1000' | 'events100' | 'events10';
export type BusinessesLevel = null | 'businessesSome' | 'businessesMost';
export type SchoolsLevel = null | 'universities' | 'schools';

export interface Mitigations {
  rrr: boolean;
  stayHome: boolean;
  bordersClosed: boolean;
  events: EventsLevel;
  businesses: BusinessesLevel;
  schools: SchoolsLevel;
}

@Injectable({
  providedIn: 'root'
})
export class MitigationsService {

  formGroup = new FormGroup({
    rrr: new FormControl(),
    stayHome: new FormControl(),
    bordersClosed: new FormControl(),
    events: new FormControl(),
    businesses: new FormControl(),
    schools: new FormControl(),
  });

  readonly value$ = this.formGroup.valueChanges.pipe(
    startWith(this.formGroup.value),
    map(val => val as MitigationsService),
    shareReplay(1),
  );

  preset(level: MitigationsPresetLevel) {
    const openned: Mitigations = {
      events: null,
      stayHome: false,
      bordersClosed: false,
      rrr: false,
      schools: null,
      businesses: null,
    };

    switch (level) {
      case 'open':
        this.set(openned);
        return;

      case 'level1':
        this.set({
          ...openned,
          events: 'events1000',
          rrr: true,
        });
        return;

      case 'level2':
        this.set({
          ...openned,
          events: 'events100',
          rrr: true,
          businesses: 'businessesSome',
          schools: 'universities',
        });
        return;

      case 'lockdown':
        this.set({
          ...openned,
          events: 'events10',
          rrr: true,
          businesses: 'businessesMost',
          schools: 'schools',
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

  optionsFor(paramName: keyof Mitigations): [value: any, label: string][] {
    switch (paramName) {
      case 'events':
        return [
          [null, 'Neomezeno'],
          ['events1000', 'Max. 1 000'],
          ['events100', 'Max. 100'],
          ['events10', 'Max. 10'],
        ];

      case 'schools':
        return [
          [null, 'Neomezeno'],
          ['universities', 'Zavřít univerzity'],
          ['schools', 'Zavřít všechny'],
        ];

      case 'businesses':
        return [
          [null, 'Neomezeno'],
          ['businessesSome', 'Zavřít univerzity'],
          ['businessesMost', 'Zavřít všechny'],
        ];

      default:
        throw new Error(`No options defined for mitigation param ${paramName}`);
    }
  }
}
