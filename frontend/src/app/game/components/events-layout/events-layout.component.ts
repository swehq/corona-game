import {Component} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';
import {inOutAnimation} from 'src/app/utils/animations';
import {cloneDeepWith} from 'lodash';
import {Event, EventChoice} from '../../../services/events';
import {GameService} from '../../game.service';
import {formatNumber} from '../../../utils/format';

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
      this.gameService.togglePause();
      if (choice?.action === 'pause') this.gameService.setSpeed('pause');
    }
  }

  get translateParams() {
    return {stats: cloneDeepWith(this.gameService.game.simulation.getLastStats(), statsFormat)};
  }
}

function statsFormat(value: any) {
  if (typeof value === 'number') return formatNumber(value, false, true);
}
