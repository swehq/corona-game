import {Directive, Input, Optional, Self} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MeasureBoolComponent} from './controls/measure-bool.component';
import {MeasureToggleComponent} from './controls/measure-toggle.component';
import {MeasuresService} from './measures.service';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[measure]'
})
export class MeasureDirective {

  @Input() set measure(controlName: string) {
    this.measureComponent.formControl = this.measuresService.formGroup.get(controlName) as FormControl;
  }

  constructor(
    @Optional() @Self() private measureBoolComponent: MeasureBoolComponent,
    @Optional() @Self() private measureToggleComponent: MeasureToggleComponent,
    private measuresService: MeasuresService,
  ) {
    if (!this.measureComponent) throw new Error('MeasureDirective can be used only witth MeasureXxxxComponent');
  }

  private get measureComponent() {
    return this.measureBoolComponent || this.measureToggleComponent;
  }
}
