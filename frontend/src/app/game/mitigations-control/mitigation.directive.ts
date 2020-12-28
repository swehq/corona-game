import {Directive, Input, Optional, Self} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MitigationBoolComponent} from './controls/mitigation-bool.component';
import {MitigationToggleComponent} from './controls/mitigation-toggle.component';
import {MitigationsService} from './mitigations.service';
import {Mitigations} from './mitigations.service';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[mitigation]'
})
export class MitigationDirective {

  @Input() set mitigation(paramName: keyof Mitigations) {
    // connect to appropriate FC
    this.mitigationComponent.formControl = this.mitigationsService.formGroup.get(paramName) as FormControl;

    // set option list
    if (this.mitigationToggleComponent) {
      this.mitigationToggleComponent.options = this.mitigationsService.optionsFor(paramName);
    }
  }

  constructor(
    @Optional() @Self() private mitigationBoolComponent: MitigationBoolComponent,
    @Optional() @Self() private mitigationToggleComponent: MitigationToggleComponent,
    private mitigationsService: MitigationsService,
  ) {
    if (!this.mitigationComponent) throw new Error('MitigationDirective can be used only with MitigationComponent');
  }

  private get mitigationComponent() {
    return this.mitigationBoolComponent || this.mitigationToggleComponent;
  }
}
