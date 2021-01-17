import {Directive, Input, Optional, Self} from '@angular/core';
import {MitigationScaleComponent} from './controls/mitigation-scale.component';
import {MitigationToggleComponent} from './controls/mitigation-toggle.component';
import {Mitigations, MitigationsService} from '../../../services/mitigations.service';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'cvd-mitigation-scale[formControlName],cvd-mitigation-toggle[formControlName]',
})
export class MitigationConfigDirective {

  @Input() set formControlName(paramName: keyof Mitigations) {
    this.levelsComponent.levels = this.mitigationsService.optionsFor(paramName);
  }

  private levelsComponent: MitigationToggleComponent | MitigationScaleComponent;

  constructor(
    @Optional() @Self() mitigationScaleComponent: MitigationScaleComponent,
    @Optional() @Self() mitigationToggleComponent: MitigationToggleComponent,
    private mitigationsService: MitigationsService,
  ) {
    this.levelsComponent = mitigationScaleComponent || mitigationToggleComponent;
  }
}
