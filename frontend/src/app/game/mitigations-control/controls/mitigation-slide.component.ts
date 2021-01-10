import {Component} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'cvd-mitigation-slide',
  template: `
    <cvd-row wrap justifyContent="space-between" [spacing]="3">
      <div class="mitigation-label">
        <ng-content></ng-content>
      </div>
      <mat-slide-toggle
        [checked]="checked"
        (change)="onUserAction($event.checked)"
      ></mat-slide-toggle>
    </cvd-row>
  `,
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: MitigationSlideComponent, multi: true}],
})
export class MitigationSlideComponent implements ControlValueAccessor {

  checked = false;

  onUserAction(checked: boolean) {
    this.checked = checked;
    this.onChange(checked);
  }

  registerOnChange(cb: (_: boolean) => void) {
    this.onChange = cb;
  }

  registerOnTouched(_: any) {
  }

  onChange = (_: boolean) => {
  }

  writeValue(value: boolean) {
    this.checked = value;
  }
}
