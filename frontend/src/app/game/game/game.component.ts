import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {filter, map} from 'rxjs/operators';
import {GameService} from '../game.service';
import {OutroService} from '../outro/outro.service';
import {Component, HostBinding} from '@angular/core';
import {DebugModeService} from 'src/app/services/debug-mode.service';

type GameState = 'intro' | 'game' | 'outro';

@UntilDestroy()
@Component({
  selector: 'cvd-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent {

  state: GameState = 'intro';

  constructor(
    public debugModeService: DebugModeService,
    outroService: OutroService,
    private gameService: GameService,
  ) {
    // fetch historical game results from BE
    window.setTimeout(() => outroService.fetchAllResults(), 10_000);

    // send current game result into outro
    gameService.gameState$.pipe(
      map(state => state.stats),
      map(stats => ({
        dead: stats.deaths.total,
        cost: stats.costs.total,
      })),
      untilDestroyed(this),
    ).subscribe(
      result => outroService.setMyResult(result),
    );

    // trigger end of game
    gameService.speed$.pipe(
      filter(speed => speed === 'finished'),
      untilDestroyed(this),
    ).subscribe(
      () => this.state = 'outro',
    );
  }

  @HostBinding('class.is-event-active')
  get isEventActiveClass() {
    return this.gameService.event;
  }
}
