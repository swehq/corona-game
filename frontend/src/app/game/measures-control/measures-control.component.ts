import {Component} from '@angular/core';
import {MeasuresService} from './measures.service';

@Component({
  selector: 'cvd-measures-control',
  templateUrl: './measures-control.component.html',
  styleUrls: ['./measures-control.component.scss']
})
export class MeasuresControlComponent {
  constructor(
    public measuresService: MeasuresService,
  ) {
  }
}
