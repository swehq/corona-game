import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ConfigService} from './services/config.service';

@Component({
  selector: 'cvd-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor(
    public configService: ConfigService,
  ) {
  }
}
