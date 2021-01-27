import {ChangeDetectorRef, Component, Input, HostBinding} from '@angular/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {MitigationsPresetLevel, MitigationsService, MitigationKey} from '../../../services/mitigations.service';

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

  optionsFor(paramName: MitigationKey) {
    return this.mitigationsService.optionsFor(paramName);
  }
}
