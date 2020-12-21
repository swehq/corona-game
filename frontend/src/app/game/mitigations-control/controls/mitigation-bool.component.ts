import {Component, Input} from '@angular/core';
import {FormControl} from '@angular/forms';

export type Labels = {
  true: string;
  false: string;
};

@Component({
  selector: 'cvd-mitigation-bool',
  template: `
    <cvd-row wrap>
      <div class="mitigation-label"><ng-content></ng-content></div>
      <mat-slide-toggle [formControl]="formControl">{{label || ''}}</mat-slide-toggle>
    </cvd-row>
  `,
  styles: [`
    :host {
      padding: 0.5rem;
    }
  `]
})
export class MitigationBoolComponent {
  @Input() label = '';
  formControl = new FormControl();
}
