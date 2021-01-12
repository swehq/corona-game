import {Component} from '@angular/core';
import {GameService} from '../game.service';
import {UntilDestroy} from '@ngneat/until-destroy';
import {EventChoice} from '../../services/events';
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

  resumeEvent(choice?: EventChoice) {
    if (choice !== undefined) {
      this.gameService.game.applyMitigationActions({
        eventMitigations: choice.mitigations,
        removeMitigationIds: choice.removeMitigationIds,
      });
    }

    this.gameService.event = undefined;
    this.gameService.setSpeed('play');
  }
}
