import {Component} from '@angular/core';
import {MetaService} from 'src/app/services/meta.service';

@Component({
  selector: 'cvd-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent {
  constructor(meta: MetaService) {
    meta.setTitle('Vítejte');
  }
}
