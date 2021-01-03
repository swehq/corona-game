import {Component, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatButtonToggleGroup} from '@angular/material/button-toggle';

type Level = [value: any, label: string];

@Component({
  selector: 'cvd-mitigation-toggle',
  template: `
    <cvd-row wrap justifyContent="flex-start">
      <div class="mitigation-label" [ngStyle]="{'min-width': labelMinWidth}">
        <ng-content></ng-content>
      </div>
      <mat-button-toggle-group
        #group grow
        [value]="value"
        (change)="onUserAction($event.value)"
      >
        <mat-button-toggle grow
          *ngFor="let level of levels"
          [value]="level[0]"
        >
          {{level[1]}}
        </mat-button-toggle>
      </mat-button-toggle-group>
    </cvd-row>
  `,
  styles: [`
    :host {
      padding: 0.5rem;
    }

  `],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: MitigationToggleComponent, multi: true}],
})
export class MitigationToggleComponent implements OnChanges, ControlValueAccessor {

  @Input() levels: Level[] = [];
  @Input() labelMinWidth = '5rem';

  @ViewChild('group') group: MatButtonToggleGroup | null = null;

  value: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.levels) {
      this.writeValue(this.value);
    }
  }

  onUserAction(value: any) {
    this.value = value;
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

    this.value = value;
  }
}
