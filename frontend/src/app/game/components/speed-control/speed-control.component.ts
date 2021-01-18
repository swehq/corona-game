import {Component, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatButtonToggleGroup} from '@angular/material/button-toggle';
import {SvgIconName} from '../../../shared/icon/icon.registry';
import {Speed} from '../../game.service';

@Component({
  selector: 'cvd-speed-control',
  templateUrl: './speed-control.component.html',
  styleUrls: ['./speed-control.component.scss'],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: SpeedControlComponent, multi: true}],
})
export class SpeedControlComponent implements OnChanges, ControlValueAccessor {

  levels: {speed: Speed, icon: SvgIconName}[] = [
    {speed: 'pause', icon: 'pause'},
    {speed: 'slow', icon: 'slow'},
    {speed: 'play', icon: 'play'},
    {speed: 'fast', icon: 'fast'},
  ];

  @ViewChild('group') group: MatButtonToggleGroup | null = null;

  value: Speed = 'play';
  disabled = false;

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
    this.value = value;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}
