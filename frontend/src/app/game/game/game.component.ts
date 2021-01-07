import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {HostListener} from '@angular/core';
import {filter, map} from 'rxjs/operators';
import {GameService} from '../game.service';
import {OutroService} from '../outro/outro.service';
import {ChangeDetectorRef, Component, HostBinding} from '@angular/core';
import {DebugModeService} from 'src/app/services/debug-mode.service';
import {inOutAnimation} from 'src/app/utils/animations';

type GameState = 'intro' | 'game' | 'outro';

@UntilDestroy()
@Component({
  selector: 'cvd-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  animations: [inOutAnimation()],
})
export class GameComponent {

  state: GameState = 'intro';
  isSmallDevice: boolean = false;
  winWidth: number = window.innerWidth;
  maxMobileWidth: number = 894;

  constructor(
    public debugModeService: DebugModeService,
    outroService: OutroService,
    private gameService: GameService,
    cd: ChangeDetectorRef,
  ) {
    // fetch historical game results from BE
    window.setTimeout(() => outroService.fetchAllResults(), 10_000);

    // detect device type
    if (this.winWidth <= this.maxMobileWidth) {
      this.isSmallDevice = true;
    }

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
      untilDestroyed(this),
    ).subscribe(() => {
      this.state = 'outro';
      cd.markForCheck();
    });
  }


  @HostBinding('class.is-event-active')
  get isEventActiveClass() {
    return this.gameService.event;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.winWidth = event.target.innerWidth;
    this.isSmallDevice = this.winWidth <= this.maxMobileWidth;
  }

  newGame() {
    this.gameService.restartSimulation();
    this.state = 'game';
  }
}
