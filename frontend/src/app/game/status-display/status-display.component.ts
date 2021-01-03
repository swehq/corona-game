import {Component} from '@angular/core';
import {get, PropertyPath} from 'lodash';
import {combineLatest} from 'rxjs';
import {distinctUntilChanged, map, shareReplay} from 'rxjs/operators';
import {Stats} from '../../services/simulation';
import {GameService} from '../game.service';

@Component({
  selector: 'cvd-status-display',
  templateUrl: './status-display.component.html',
  styleUrls: ['./status-display.component.scss'],
})
export class StatusDisplayComponent {

  private stats$ = this.gameService.gameState$.pipe(
    map(state => state.stats),
    distinctUntilChanged(),
    shareReplay(1),
  );

  private sirState$ = this.gameService.gameState$.pipe(
    map(state => state.sirState),
    distinctUntilChanged(),
    shareReplay(1),
  );

  immunized$ = combineLatest([
    this.stats$,
    this.sirState$,
  ]).pipe(
    map(([stats, sirState]) => Math.round(sirState.resistant + stats.vaccinationRate * sirState.suspectible)),
  );

  constructor(
    private gameService: GameService,
  ) {
  }

  stat$(name: keyof Stats, path?: PropertyPath) {
    const res = this.stats$.pipe(
      map(stats => stats[name]),
    );

    if (!path) return res;

    return res.pipe(
      map(stat => get(stat, path)),
    );
  }
}
