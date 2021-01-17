import {Component} from '@angular/core';
import {MetaService} from 'src/app/services/meta.service';

@Component({
  selector: 'cvd-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  constructor(meta: MetaService) {
    meta.setTitle('Metodika');
  }
}
