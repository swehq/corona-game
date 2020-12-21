import {Component, Input} from '@angular/core';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'cvd-mitigation-toggle',
  template: `
    <cvd-row wrap justifyContent="flex-start">
      <div class="mitigation-label"><ng-content></ng-content></div>
      <mat-button-toggle-group [formControl]="formControl">
        <mat-button-toggle
          *ngFor="let option of options"
          [value]="option[0]"
        >
          {{option[1]}}
        </mat-button-toggle>
      </mat-button-toggle-group>
    </cvd-row>
  `,
  styles: [`
    :host {
      padding: 0.5rem;
    }
    :host ::ng-deep .mat-button-toggle-label-content {
      line-height: 2rem;
    }
  `]
})
export class MitigationToggleComponent {
  @Input() options: [value: any, label: string][] = [];
  formControl = new FormControl();
}
