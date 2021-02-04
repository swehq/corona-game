import {Component} from '@angular/core';
import {MetaService} from 'src/app/services/meta.service';

@Component({
  selector: 'cvd-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent {
  constructor(meta: MetaService) {
    meta.setTitle('Metodika');
   }
}