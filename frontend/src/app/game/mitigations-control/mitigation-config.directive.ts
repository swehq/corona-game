import {Directive, Input, Self} from '@angular/core';
import {MitigationScaleComponent} from './controls/mitigation-scale.component';
import {Mitigations, MitigationsService} from './mitigations.service';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'cvd-mitigation-toggle[formControlName]',
})
export class MitigationConfigDirective {

  @Input() set formControlName(paramName: keyof Mitigations) {
    this.mitigationToggleComponent.levels = this.mitigationsService.optionsFor(paramName);
  }

  constructor(
    @Self() private mitigationToggleComponent: MitigationScaleComponent,
    private mitigationsService: MitigationsService,
  ) {
  }
}
