import {isPlatformBrowser} from '@angular/common';
import {Component, Inject, PLATFORM_ID} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChartDataSets, ChartOptions, ChartPoint, ScaleTitleOptions} from 'chart.js';
import {combineLatest, Observable, of} from 'rxjs';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {TranslateService} from '@ngx-translate/core';
import {MetaService} from 'src/app/services/meta.service';
import {SocialNetworkShareService} from 'src/app/services/social-network-share.service';
import {formatNumber, formatStats} from '../../../utils/format';
import {GameService} from '../../game.service';
import {GameResult, OutroService} from './outro.service';
import {settings as randomSettings} from '../../../services/randomize';
import {marker as _} from '@biesbjerg/ngx-translate-extract-marker';

const MY_RESULT_COLOR = '#9fe348';
const ALL_RESULTS_COLOR = 'rgb(71, 227, 217, 0.25)';

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
  resultId$: Observable<string>;
  isGameReady$ = this.outroService.current$.pipe(
    map(current => current.gameIsReady),
  );
  isMyGame = false;

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
          label: _('Můj výsledek'),
          data: myPoints,
          backgroundColor: MY_RESULT_COLOR,
          pointBorderColor: MY_RESULT_COLOR,
          pointBackgroundColor: MY_RESULT_COLOR,
          pointRadius: 10,
        });
      }

      if (allPoints) {
        datasets.push({
          label: _('Výsledky ostatních hráčů'),
          data: allPoints,
          backgroundColor: ALL_RESULTS_COLOR,
          pointBorderColor: 'rgba(0,0,0,0)',
          pointBackgroundColor: ALL_RESULTS_COLOR,
          pointRadius: 2,
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
          if (data!.datasets!.length > 1 && !results[0].datasetIndex) {
            return this.translateService.instant(_('Můj výsledek'));
          }
          if (results.length === 1) return this.translateService.instant(_('Výsledek jiného hráče'));
          return this.translateService.instant(_('Výsledek {{numOthers}} jiných hráčů'), {numOthers: results.length});
        },
        beforeBody: node => [
          this.translateService.instant(_('Celkový počet mrtvých')) + `: ${formatNumber(+node[0].xLabel!)}`,
          this.translateService.instant(_('Celkové náklady')) + `: ${formatNumber(+node[0].yLabel!, true, true)}`,
        ],
        label: () => '',
      },
    },
    scales: {
      xAxes: [{
        scaleLabel: {
          ...this.scalesLabelsDefaults,
          labelString: _('Celkový počet mrtvých'),
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
          labelString: _('Celkové náklady'),
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
    private translateService: TranslateService,
    activatedRoute: ActivatedRoute,
    router: Router,
    @Inject(PLATFORM_ID) platformId: string,
  ) {
    this.resultId$ = activatedRoute.params.pipe(
      map(data => data.id),
      tap(id => this.isMyGame = this.gameService.isMyGameId(id)),
    );
    meta.setTitle(_('Výsledky'));
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

  get i18nData() {
    const stats = this.stats;
    const estimateInfectionsTotal = stats ?
      formatNumber(stats.detectedInfections.total / randomSettings.detectionRate[0], false, true) : undefined;
    const budget2019 = formatNumber(1551e9, true, true);
    const budget2020 = formatNumber(1842e9, true, true);
    return {stats: formatStats(stats), estimateInfectionsTotal, budget2019, budget2020};
  }

  isGameLost() {
    return this.gameService.game?.isGameLost();
  }
}
