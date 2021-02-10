import {Component} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';
import {inOutAnimation} from 'src/app/utils/animations';
import {Event, EventChoice} from '../../../services/events';
import {I18nService} from '../../../services/i18n.service';
import {GameService} from '../../game.service';

@UntilDestroy()
@Component({
  selector: 'cvd-events-layout',
  templateUrl: './events-layout.component.html',
  styleUrls: ['./events-layout.component.scss'],
  animations: [inOutAnimation()],
})
export class EventsLayoutComponent {
  constructor(
    public gameService: GameService,
    private i18nService: I18nService,
  ) {
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
      this.gameService.togglePause();
      if (choice?.action === 'pause') this.gameService.setSpeed('pause');
    }
  }

  get translateParams() {
    return {stats: this.i18nService.formatStats(this.gameService.game.simulation.getLastStats())};
  }
}
