import {Component} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';
import {ChartDataSets, ChartPoint} from 'chart.js';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {GameResult, OutroService} from './outro.service';

@UntilDestroy()
@Component({
  selector: 'cvd-outro',
  templateUrl: './outro.component.html',
  styleUrls: ['./outro.component.scss'],
})
export class OutroComponent {

  datasets$: Observable<ChartDataSets[]> = combineLatest([
    this.outroService.myResult$,
    this.outroService.allResults$,
  ]).pipe(
    map(([myResult, allResults]) => {
      const datasets: ChartDataSets[] = [];

      const convert: (result: GameResult) => ChartPoint =
        result => ({
          x: result.dead,
          y: result.cost,
        });

      if (myResult) {
        datasets.push({
          label: 'Můj výsledek',
          data: [convert(myResult)],
          backgroundColor: 'red',
          pointBorderColor: 'red',
          pointBackgroundColor: 'red',
          pointRadius: 10,
        });
      }

      if (allResults) {
        datasets.push({
          label: 'Výsledky ostatních her',
          data: allResults.map(convert),
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
