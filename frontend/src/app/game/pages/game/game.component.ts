import {Component, HostBinding} from '@angular/core';
import {Router} from '@angular/router';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {filter, switchMap} from 'rxjs/operators';
import {DebugModeService} from 'src/app/services/debug-mode.service';
import {MetaService} from 'src/app/services/meta.service';
import {inOutAnimation} from 'src/app/utils/animations';
import {GameService} from '../../game.service';
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
    private outroService: OutroService,
    private gameService: GameService,
    private router: Router,
    meta: MetaService,
  ) {
    meta.setTitle('Hra');

    // fetch historical game results from BE
    window.setTimeout(() => outroService.fetchAllResults(), 10_000);

    // trigger end of game
    gameService.speed$.pipe(
      filter(speed => speed === 'finished'),
      switchMap(() => this.outroService.saveGame$()),
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
