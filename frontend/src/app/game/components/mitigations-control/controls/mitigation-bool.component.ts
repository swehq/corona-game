import {Component, Input} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {SvgIconName} from '../../../../shared/icon/icon.registry';

@Component({
  selector: 'cvd-mitigation-bool',
  template: `
    <mat-button-toggle
      grow style="overflow: visible"
      (click)="onUserAction()"
      [checked]="checked"
    >
      <ng-content></ng-content>
    </mat-button-toggle>
  `,
  styleUrls: ['./mitigation-bool.component.scss'],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: MitigationBoolComponent, multi: true}],
})
export class MitigationBoolComponent implements ControlValueAccessor {
  @Input() imgOn: SvgIconName | undefined;
  @Input() imgOff: SvgIconName | undefined;

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
