import {Component} from '@angular/core';
import {MitigationsService} from '../mitigations-control/mitigations.service';

@Component({
  selector: 'cvd-status-display',
  templateUrl: './status-display.component.html',
  styleUrls: ['./status-display.component.scss']
})
export class StatusDisplayComponent {
  constructor(
    public mitigationsService: MitigationsService,
  ) {
  }
}
