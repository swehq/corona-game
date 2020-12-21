import {Component} from '@angular/core';
import {MeasuresService} from '../measures-control/measures.service';

@Component({
  selector: 'cvd-status-display',
  templateUrl: './status-display.component.html',
  styleUrls: ['./status-display.component.scss']
})
export class StatusDisplayComponent {
  constructor(
    public measuresService: MeasuresService,
  ) {
  }
}
