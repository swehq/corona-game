import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChangeDetectorRef, Component} from '@angular/core';
import {MitigationsPresetLevel, MitigationsService, MitigationKey} from '../../../services/mitigations.service';

@UntilDestroy()
@Component({
  selector: 'cvd-mitigations-control',
  templateUrl: './mitigations-control.component.html',
  styleUrls: ['./mitigations-control.component.scss'],
})
export class MitigationsControlComponent {
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
