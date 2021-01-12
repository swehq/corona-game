import {Component} from '@angular/core';
import {get, PropertyPath} from 'lodash';
import {Observable} from 'rxjs';
import {distinctUntilChanged, filter, map, shareReplay} from 'rxjs/operators';
import {formatNumber} from 'src/app/utils/format';
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
    map(stats => {
      const increment = stats.estimatedResistant.today + stats.vaccinated.today;

      return {
        today: (Math.sign(increment) >= 0 ? '+' : '') + formatNumber(increment),
        total: stats.estimatedResistant.total + stats.vaccinated.total,
      };
    }),
  );

  constructor(
    private gameService: GameService,
  ) {
  }

  get today() {
    return new Date(this.gameService.lastDate).toLocaleDateString();
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

  getColor$(value$: Observable<any>, low: number, high: number) {
    return value$.pipe(map(value => {
      // scales goes down
      if (low > high) {
        value = -value;
        const newHigh = low;
        low = high;
        high = newHigh;
      }

      if (value < low) return 'primary';
      if (value < high) return 'accent';
      return 'warn';
    }));
  }
}
