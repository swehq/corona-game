import {Component} from '@angular/core';
import {MetaService} from 'src/app/services/meta.service';

@Component({
  selector: 'cvd-credits',
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.scss'],
})
export class CreditsComponent {
  constructor(meta: MetaService) {
    meta.setTitle('Tvůrci');
  }
}
