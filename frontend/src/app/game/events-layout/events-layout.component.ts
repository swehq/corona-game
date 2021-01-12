import {Component, HostListener} from '@angular/core';
import {GameService} from '../game.service';
import {UntilDestroy} from '@ngneat/until-destroy';
import {EventMitigation} from '../../services/events';
import {inOutAnimation} from 'src/app/utils/animations';

@UntilDestroy()
@Component({
  selector: 'cvd-events-layout',
  templateUrl: './events-layout.component.html',
  styleUrls: ['./events-layout.component.scss'],
  animations: [inOutAnimation],
})
export class EventsLayoutComponent {
  @HostListener('document:keydown.enter')
  enterListener() {
    if (this.eventWithSingleButton) {
      const event = this.gameService.event;
      this.resumeEvent(event?.mitigations?.length ? event.mitigations[0] : undefined);
    }
  }

  constructor(public gameService: GameService) {
  }

  get eventWithSingleButton() {
    return this.gameService.event &&
      (!this.gameService.event.mitigations?.length || this.gameService.event.mitigations?.length === 1);
  }

  resumeEvent(eventMitigation?: EventMitigation) {
    if (eventMitigation !== undefined) {
      this.gameService.game.applyMitigationActions({eventMitigations: [eventMitigation]});
    }

    this.gameService.event = undefined;
    this.gameService.setSpeed('play');
  }
}
