import {Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {get, PropertyPath} from 'lodash';
import {Observable} from 'rxjs';
import {distinctUntilChanged, filter, map, shareReplay} from 'rxjs/operators';
import {Stats} from '../../../services/simulation';
import {GameService} from '../../game.service';

@UntilDestroy()
@Component({
  selector: 'cvd-status-display',
  templateUrl: './status-display.component.html',
  styleUrls: ['./status-display.component.scss'],
})
export class StatusDisplayComponent {

  speedFormControl = new FormControl();

  lastState$ = this.gameService.gameState$.pipe(
    filter(states => states.length > 0),
    map(states => states[states.length - 1]),
  );

  private stats$ = this.lastState$.pipe(
    map(state => state.stats),
    distinctUntilChanged(),
    shareReplay(1),
  );

  constructor(
    private gameService: GameService,
  ) {
    this.speedFormControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(speed => this.gameService.setSpeed(speed));

    this.gameService.speed$
      .pipe(untilDestroyed(this))
      .subscribe(speed => {
        this.speedFormControl.setValue(speed);
        // TODO enable after disabled state implemented
        // if (this.gameService.currentEvent) this.speedFormControl.disable(); else this.speedFormControl.enable();
      });
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
        low = -low;
        high = -high;
      }

      if (value < low) return 'primary';
      if (value < high) return 'accent';
      return 'warn';
    }));
  }
}
