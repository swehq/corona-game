import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {UntilDestroy} from '@ngneat/until-destroy';
import {ChartDataSets, ChartPoint} from 'chart.js';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {GameResult, OutroService} from './outro.service';
import {GameService} from '../game.service';

const MY_RESULT_COLOR = '#9fe348';
const ALL_RESULTS_COLOR = 'rgb(71, 227, 217, 0.5)';

const convert: (result: GameResult) => ChartPoint =
  result => ({
    x: result.dead,
    y: result.cost,
  });

@UntilDestroy()
@Component({
  selector: 'cvd-outro',
  templateUrl: './outro.component.html',
  styleUrls: ['./outro.component.scss'],
})
export class OutroComponent {

  arePricesShowing: boolean = false;

  facts: {[id: string] : number} = {
    'nurse' : 30000,
    'house' : 6899000,
    'beer': 32,
  };

  datasets$: Observable<ChartDataSets[]> = combineLatest([
    this.outroService.myResult$.pipe(
      map(result => result ? [convert(result)] : null),
    ),
    this.outroService.allResults$.pipe(
      map(results => results ? results.map(convert) : null),
    ),
  ]).pipe(
    map(([myPoints, allPoints]) => {
      const datasets: ChartDataSets[] = [];

      if (myPoints) {
        datasets.push({
          label: 'Můj výsledek',
          data: myPoints,
          backgroundColor: MY_RESULT_COLOR,
          pointBorderColor: MY_RESULT_COLOR,
          pointBackgroundColor: MY_RESULT_COLOR,
          pointRadius: 10,
        });
      }

      if (allPoints) {
        datasets.push({
          label: 'Výsledky ostatních her',
          data: allPoints,
          backgroundColor: ALL_RESULTS_COLOR,
          pointBorderColor: ALL_RESULTS_COLOR,
          pointBackgroundColor: ALL_RESULTS_COLOR,
        });
      }

      return datasets;
    }),
  );

  constructor(
    private outroService: OutroService, private gameService: GameService, private router: Router,
  ) {
    outroService.fetchAllResults();
  }

  get stats() {
    const lastStats = this.gameService.game.simulation.getLastStats();
    if (lastStats === undefined) throw new Error('Missing game statistics');
    return lastStats;
  }

  isGameLost() {
    return this.gameService.game.isGameLost();
  }

  openInfoPage() {
    this.router.navigate(['/functionality-info']);
  }

  showPrices() {
    this.arePricesShowing = this.arePricesShowing === false ? true : false;
  }
}
