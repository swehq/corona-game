import {Component, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'cvd-mitigation-bool',
  template: `
    <cvd-row wrap (click)="onUserAction()">
      <div grow>
        <ng-content></ng-content>
      </div>
      <cvd-icon *ngIf="checked" [svgIcon]="imgOn" size="large">check_circle_outline</cvd-icon>
      <cvd-icon *ngIf="!checked" [svgIcon]="imgOff" size="large">highlight_off</cvd-icon>
    </cvd-row>
  `,
  styleUrls: ['./mitigation-bool.component.scss'],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: MitigationBoolComponent, multi: true}],
})
export class MitigationBoolComponent implements ControlValueAccessor {
  @Input() imgOn = '';
  @Input() imgOff = '';

  checked = false;

  onUserAction() {
    this.checked = !this.checked;
    this.onChange(this.checked);
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
