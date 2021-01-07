import {Component} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';
import {ChartDataSets, ChartPoint} from 'chart.js';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {GameResult, OutroService} from './outro.service';

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
          backgroundColor: 'red',
          pointBorderColor: 'red',
          pointBackgroundColor: 'red',
          pointRadius: 10,
        });
      }

      if (allPoints) {
        datasets.push({
          label: 'Výsledky ostatních her',
          data: allPoints,
          backgroundColor: 'blue',
          pointBorderColor: 'blue',
          pointBackgroundColor: 'blue',
        });
      }

      return datasets;
    }),
  );

  constructor(
    private outroService: OutroService,
  ) {
    outroService.fetchAllResults();
  }
}
