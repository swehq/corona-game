import {Component} from '@angular/core';
import {get, PropertyPath} from 'lodash';
import {distinctUntilChanged, filter, map, shareReplay} from 'rxjs/operators';
import {Stats} from '../../services/simulation';
import {GameService} from '../game.service';

@Component({
  selector: 'cvd-status-display',
  templateUrl: './status-display.component.html',
  styleUrls: ['./status-display.component.scss'],
})
export class StatusDisplayComponent {
  lastState$ = this.gameService.gameState$.pipe(
    filter(states => states.length > 0),
    map(states => states[states.length - 1]),
  );

  private stats$ = this.lastState$.pipe(
    map(state => state.stats),
    distinctUntilChanged(),
    shareReplay(1),
  );

  immunized$ = this.stats$.pipe(
    map(stats => stats.estimatedResistant + stats.vaccinated),
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
