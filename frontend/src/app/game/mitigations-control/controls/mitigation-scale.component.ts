import {Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatSlider} from '@angular/material/slider';

type Level = [value: any, label: string];

@Component({
  selector: 'cvd-mitigation-scale',
  template: `
    <div>
      <ng-content></ng-content>
    </div>
    <cvd-row justifyContent="flex-start" alignItems="center">
      <mat-slider
        #slider style="margin-right: 1rem"
        [min]="0" [max]="levels.length - 1" [tickInterval]="1"
        (input)="onUserAction($event.value)"
      ></mat-slider>
      <div [ngStyle]="{'min-width': labelMinWidth}">{{label}}</div>
    </cvd-row>
  `,
  styles: [`
    :host {
      padding: 0.5rem;
    }
  `],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: MitigationScaleComponent, multi: true}],
})
export class MitigationScaleComponent implements OnChanges, ControlValueAccessor {

  @Input() levels: Level[] = [];
  @Input() labelMinWidth = '';

  @ViewChild('slider') slider: MatSlider | null = null;

  value: any = null;
  label = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.levels) {
      this.writeValue(this.value);
    }
  }

  onUserAction(index: number | null) {
    [this.value, this.label] = this.levels[index || 0];
    this.onChange(this.value);
  }

  registerOnChange(cb: (_: any) => void) {
    this.onChange = cb;
  }

  registerOnTouched(_: any) {
  }

  onChange = (_: any) => {
  }

  writeValue(value: any) {
    if (!this.levels.length) return;

    const index = this.levels.findIndex(level => level[0] === value);
    if (index < 0) throw new Error(`There is no level for value ${value}`);

    [this.value, this.label] = this.levels[index];
    if (this.slider) this.slider.value = index;
  }
}
