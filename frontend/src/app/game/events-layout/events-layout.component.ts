import {Component} from '@angular/core';
import {GameService} from '../game.service';
import {UntilDestroy} from '@ngneat/until-destroy';
import {EventMitigation} from '../../services/events';

@UntilDestroy()
@Component({
  selector: 'cvd-events-layout',
  templateUrl: './events-layout.component.html',
  styleUrls: ['./events-layout.component.scss'],
})
export class EventsLayoutComponent {
  constructor(public gameService: GameService) {
  }

  resumeEvent(eventMitigation?: EventMitigation) {
    if (eventMitigation !== undefined) {
      this.gameService.game.applyMitigationActions({eventMitigations: [eventMitigation]});
    }

    this.gameService.event = undefined;
    this.gameService.setSpeed('play');
  }
}
