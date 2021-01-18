import {Component} from '@angular/core';
import {GameService} from '../../game.service';
import {UntilDestroy} from '@ngneat/until-destroy';
import {Event, EventChoice} from '../../../services/events';
import {inOutAnimation} from 'src/app/utils/animations';

@UntilDestroy()
@Component({
  selector: 'cvd-events-layout',
  templateUrl: './events-layout.component.html',
  styleUrls: ['./events-layout.component.scss'],
  animations: [inOutAnimation()],
})
export class EventsLayoutComponent {
  constructor(public gameService: GameService) {
  }

  resumeEvent(event: Event, choice?: EventChoice) {
    if (choice !== undefined) {
      if (choice.action === 'restart') {
        this.gameService.restartSimulation();
        return;
      }

      this.gameService.game.applyMitigationActions({
        eventMitigations: choice.mitigations,
        removeMitigationIds: choice.removeMitigationIds,
      });

      this.gameService.game.saveEventChoice({event, choice});
    }

    this.gameService.removeEvent();
    if (!this.gameService.currentEvent) {
      this.gameService.setSpeed('play');
    }
  }
}
