import {Component, HostBinding} from '@angular/core';
import {Router} from '@angular/router';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {filter, map, switchMap} from 'rxjs/operators';
import {DebugModeService} from 'src/app/services/debug-mode.service';
import {inOutAnimation} from 'src/app/utils/animations';
import {GameService} from '../game.service';
import {OutroService} from '../outro/outro.service';

@UntilDestroy()
@Component({
  selector: 'cvd-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  animations: [inOutAnimation()],
})
export class GameComponent {

  constructor(
    public debugModeService: DebugModeService,
    outroService: OutroService,
    private gameService: GameService,
    private router: Router,
  ) {
    // fetch historical game results from BE
    window.setTimeout(() => outroService.fetchAllResults(), 10_000);

    // send current game result into outro
    gameService.gameState$.pipe(
      filter(states => states.length > 0),
      map(states => states[states.length - 1]),
      map(state => ({
        dead: state.stats.deaths.total,
        cost: state.stats.costs.total,
      })),
      untilDestroyed(this),
    ).subscribe(
      result => outroService.setMyResult(result),
    );

    // trigger end of game
    gameService.speed$.pipe(
      filter(speed => speed === 'finished'),
      switchMap(() => this.gameService.reqestToSave()),
      map(response => response.id),
      untilDestroyed(this),
    ).subscribe(
      id => this.router.navigate([`/results/${id}`]),
      () => this.router.navigate(['/results']),
    );
  }

  @HostBinding('class.is-event-active')
  get isEventActiveClass() {
    return this.gameService.currentEvent;
  }

  pause() {
    this.gameService.setSpeed('pause');
  }
}
