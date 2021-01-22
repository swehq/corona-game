import {HostBinding} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChangeDetectorRef, Component, Input} from '@angular/core';
import {MitigationsPresetLevel, MitigationsService, Mitigations} from '../../../services/mitigations.service';

@UntilDestroy()
@Component({
  selector: 'cvd-mitigations-control',
  templateUrl: './mitigations-control.component.html',
  styleUrls: ['./mitigations-control.component.scss'],
})
export class MitigationsControlComponent {
  @Input() isSmallDevice = false;

  @HostBinding('class.is-small-device')
  get isSmallDeviceClass() {return this.isSmallDevice; }

  constructor(public mitigationsService: MitigationsService, cd: ChangeDetectorRef) {
    mitigationsService.formGroup.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => cd.detectChanges());
  }

  preset(level: MitigationsPresetLevel) {
    this.mitigationsService.preset(level);
  }

  optionsFor(paramName: keyof Mitigations) {
    return this.mitigationsService.optionsFor(paramName);
  }
}
