import {AfterViewInit, Component} from '@angular/core';
import {GameService} from '../game.service';
import {ChartOptions} from 'chart.js';
import {formatCZK} from '../../utils/format';
import {Subject} from 'rxjs';
import {ChartValue} from '../chart/chart.component';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'cvd-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements AfterViewInit {
  costTotalCustomOptions: ChartOptions = {
    scales: {
      yAxes: [{
        ticks: {
          callback(value: number | string) {
            if (value < 1_000_000) {
              return formatCZK(+value, false);
            }

            if (value > 1_000_000 && value < 1_000_000_000) {
              return `${formatCZK(+value / 1_000_000, false)} mil.`;
            }

            return`${formatCZK(+value / 1_000_000_000, false)} mild.`;
          },
        },
      }],
    },
  };

  private _infectedToday$ = new Subject<ChartValue>();
  infectedToday$ = this._infectedToday$.asObservable();

  private _costTotal$ = new Subject<ChartValue>();
  costTotal$ = this._costTotal$.asObservable();

  private _deathToday$ = new Subject<ChartValue>();
  deathToday$ = this._deathToday$.asObservable();

  private _immunized$ = new Subject<{resistant: ChartValue; vaccinated: ChartValue}>();
  immunized$ = this._immunized$.asObservable();

  costTotalTooltip(value: number) {
    return `Celkové náklady: ${formatCZK(value)}`;
  }

  constructor(public gameService: GameService) {
  }

  ngAfterViewInit() {
    this.gameService.restartSimulation();
    this.gameService.gameState$.pipe(
      untilDestroyed(this),
    ).subscribe(s => {
      this._immunized$.next({
        resistant: {
          label: s.date,
          value: s.sirState.resistant,
        },
        vaccinated: {
          label: s.date,
          value: s.stats.vaccinationRate,
        },
      });

      this._costTotal$.next({
        label: s.date,
        value: s.stats.costTotal,
      });

      this._infectedToday$.next({
        label: s.date,
        value: s.stats.detectedInfections.today,
      });

      this._deathToday$.next({
        label: s.date,
        value: s.stats.deaths.today,
      });
    });
  }
}
