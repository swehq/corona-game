import {Component} from '@angular/core';
import {MitigationsPresetLevel, MitigationsService, Mitigations} from './mitigations.service';

@Component({
  selector: 'cvd-mitigations-control',
  templateUrl: './mitigations-control.component.html',
  styleUrls: ['./mitigations-control.component.scss']
})
export class MitigationsControlComponent {

  constructor(
    public mitigationsService: MitigationsService,
  ) {
  }

  preset(level: MitigationsPresetLevel) {
    this.mitigationsService.preset(level);
  }

  optionsFor(paramName: keyof Mitigations) {
    return this.mitigationsService.optionsFor(paramName);
  }
}
