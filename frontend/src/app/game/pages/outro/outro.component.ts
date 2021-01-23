import {isPlatformBrowser} from '@angular/common';
import {Component, Inject, PLATFORM_ID} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChartDataSets, ChartOptions, ChartPoint, ScaleTitleOptions} from 'chart.js';
import {combineLatest, Observable, of} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {MetaService} from 'src/app/services/meta.service';
import {SocialNetworkShareService} from 'src/app/services/social-network-share.service';
import {formatNumber} from '../../../utils/format';
import {GameService} from '../../game.service';
import {GameResult, OutroService} from './outro.service';

const MY_RESULT_COLOR = '#9fe348';
const ALL_RESULTS_COLOR = 'rgb(71, 227, 217, 0.5)';

interface OutroChartPoint extends ChartPoint {
  result: GameResult;
}

const convert: (result: GameResult) => OutroChartPoint =
  result => ({
    x: result.dead,
    y: result.cost,
    result,
  });

@UntilDestroy()
@Component({
  selector: 'cvd-outro',
  templateUrl: './outro.component.html',
  styleUrls: ['./outro.component.scss'],
})
export class OutroComponent {

  resultId$: Observable<string>;
  isGameReady$ = this.outroService.current$.pipe(
    map(current => current.gameIsReady),
  );

  private readonly scalesLabelsDefaults: ScaleTitleOptions = {
    display: true,
    fontSize: 16,
  };

  datasets$: Observable<ChartDataSets[]> = combineLatest([
    this.outroService.current$.pipe(
      map(current => current.result),
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
          label: 'Výsledky ostatních hráčů',
          data: allPoints,
          backgroundColor: ALL_RESULTS_COLOR,
          pointBorderColor: ALL_RESULTS_COLOR,
          pointBackgroundColor: ALL_RESULTS_COLOR,
        });
      }

      return datasets;
    }),
  );

  outroChartOptions: ChartOptions = {
    legend: {
      labels: {
        fontSize: 14,
      },
    },
    tooltips: {
      displayColors: false,
      callbacks: {
        title: (results, data) => {
          if (data!.datasets!.length > 1 && !results[0].datasetIndex) return 'Můj výsledek';
          if (results.length === 1) return 'Výsledek jiného hráče';
          return `Výsledek ${results.length} jiných hráčů`;
        },
        beforeBody: (node, data) => {
          const dataset = data!.datasets![node[0].datasetIndex!];
          const point = dataset!.data![node[0].index!] as OutroChartPoint;
          const result = point.result;
          const ret = [
            `Celkový počet mrtvých: ${formatNumber(result.dead)}`,
            `Celkové náklady: ${formatNumber(result.cost, true, true)}`,
          ];
          if (result.schoolDaysLost !== undefined) {
            ret.push(`Ztracených dnů výuky: ${formatNumber(result.schoolDaysLost)}`);
          }
          if (result.stability !== undefined) {
            ret.push(`Společenská stabilita: ${formatNumber(result.stability)}`);
          }
          return ret;
        },
        label: () => '',
      },
    },
    scales: {
      xAxes: [{
        scaleLabel: {
          ...this.scalesLabelsDefaults,
          labelString: 'Celkový počet mrtvých',
        },
        type: 'linear',
        position: 'bottom',
        ticks: {
          callback(value: number | string) {
            return formatNumber(+value, false, true);
          },
        },
      }],
      yAxes: [{
        scaleLabel: {
          ...this.scalesLabelsDefaults,
          labelString: 'Celkové náklady',
        },
        ticks: {
          callback(value: number | string) {
            return formatNumber(+value, false, true);
          },
        },
      }],
    },
    plugins: {
      datalabels: {
        display: false,
      },
    },
  };

  completeUrl = '';

  constructor(
    private outroService: OutroService,
    public gameService: GameService,
    meta: MetaService,
    public shareService: SocialNetworkShareService,
    activatedRoute: ActivatedRoute,
    router: Router,
    @Inject(PLATFORM_ID) platformId: string,
  ) {
    this.resultId$ = activatedRoute.params.pipe(map(data => data.id));
    meta.setTitle('Výsledky');
    outroService.fetchAllResults();

    if (isPlatformBrowser(platformId)) {
      this.completeUrl = window.location.href;
    }

    this.resultId$.pipe(
      switchMap(id => id
        ? outroService.loadGame$(id)
        : this.gameService.speed$.pipe(map(speed => speed === 'finished'))),
      catchError(() => of(false)),
      untilDestroyed(this),
    ).subscribe(
      gameIsValidAndFinished => {
        if (!gameIsValidAndFinished) router.navigate(['/']);
      },
    );
  }

  get stats() {
    return this.gameService.game?.simulation?.getLastStats();
  }

  isGameLost() {
    return this.gameService.game?.isGameLost();
  }
}
