import {AfterViewInit, Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {marker as _} from '@biesbjerg/ngx-translate-extract-marker';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TranslateService} from '@ngx-translate/core';
import {ChartOptions} from 'chart.js';
import {first, last} from 'lodash';
import {Observable} from 'rxjs';
import {filter, map, tap} from 'rxjs/operators';
import {I18nService} from '../../../services/i18n.service';
import {changeFavicon} from '../../../services/router-utils.service';
import {GameService} from '../../game.service';
import {ChartValue, colors, DataLabelNode, NodeState} from './line-graph/line-graph.component';

export const CRITICAL_VIRUS_THRESHOLD = 15_000;

@UntilDestroy()
@Component({
  selector: 'cvd-graphs',
  templateUrl: './graphs.component.html',
  styleUrls: ['./graphs.component.scss'],
})
export class GraphsComponent implements AfterViewInit {

  scopeFormControl = new FormControl(0);

  costTotalCustomOptions: ChartOptions = {
    scales: {
      yAxes: [{
        ticks: {
          callback: (value: number | string) => this.i18nService.formatNumber(+value, false, true, 2),
        },
      }],
    },
  };

  immunizedCustomOptions: ChartOptions = {
    legend: {
      display: true,
    },
    scales: {
      yAxes: [{
        stacked: true,
      }],
    },
  };

  infectedToday$: Observable<ChartValue[]> | undefined;
  costTotal$: Observable<ChartValue[]> | undefined;
  deathTotal$: Observable<ChartValue[]> | undefined;
  immunizedChart$: Observable<ChartValue[][]> | undefined;
  immunized$: Observable<number> | undefined;

  dataLabelNodes: DataLabelNode[] = [];
  templateData: any | undefined;
  activeTab = 0;
  virusFavicon = false;

  private costDailyThresholds(value: number): NodeState {
    if (value < 500_000_000) return 'ok';
    if (value < 2_000_000_000) return 'warn';
    return 'critical';
  }

  private deathDailyThresholds(value: number): NodeState {
    if (value < 50) return 'ok';
    if (value < 150) return 'warn';
    return 'critical';
  }

  private infectedThresholds(value: number): NodeState {
    if (value < 5_000) return 'ok';
    if (value < CRITICAL_VIRUS_THRESHOLD) return 'warn';
    return 'critical';
  }

  constructor(
    public gameService: GameService,
    private i18nService: I18nService,
    private translateService: TranslateService,
  ) {
    this.scopeFormControl.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(
      newVal => this.scopeFormControl.setValue(newVal, {emitEvent: false}),
    );

    const data$ = this.gameService.gameState$;

    data$.pipe(
      map(data => data.slice(this.dataLabelNodes.length)), // just new data
      untilDestroyed(this),
    ).subscribe(data => {
      data.forEach(dayState => {
        // TODO just first event of the day is displayed in the chart, display all
        const event = first(this.gameService.game.eventChoices[dayState.date]);
        const uiChange = this.gameService.game.mitigationControlChanges[dayState.date];
        this.dataLabelNodes.push({event, uiChange});
      });
    });

    const getTooltipFormatter = (label: string, showCurrencySymbol = false, shrink = false) =>
      (value: number) => [
        this.translateService.instant(label),
        this.i18nService.formatNumber(value, showCurrencySymbol, shrink),
      ].join(': ');

    this.infectedToday$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ({
        label: gs.date,
        value: gs.stats.detectedInfections.today,
        tooltipLabel: getTooltipFormatter(_('Nově nakažení')),
        state: this.infectedThresholds(gs.stats.detectedInfections.today),
      }))),
      tap(infected => {
        const newlyInfected = infected[infected.length - 1].value;
        if (this.virusFavicon !== newlyInfected > CRITICAL_VIRUS_THRESHOLD) {
          this.virusFavicon = !this.virusFavicon;
          changeFavicon(this.virusFavicon);
        }
      }),
    );

    this.costTotal$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ({
        label: gs.date,
        value: gs.stats.costs.total,
        tooltipLabel: getTooltipFormatter(_('Celkové náklady'), true, true),
        state: this.costDailyThresholds(gs.stats.costs.today),
      }))),
    );

    this.deathTotal$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ({
        label: gs.date,
        value: gs.stats.deaths.total,
        tooltipLabel: getTooltipFormatter(_('Zemřelí')),
        state: this.deathDailyThresholds(gs.stats.deaths.today),
      }))),
    );

    this.immunizedChart$ = data$.pipe(
      map(gameStates => gameStates.map(gs => ([
        {
          label: gs.date,
          value: gs.stats.vaccinated.total,
          tooltipLabel: getTooltipFormatter(_('Očkovaní')),
          datasetOptions: {
            backgroundColor: `${colors.critical}33`,
            borderColor: `${colors.warn}`,
            label: _('Očkovaní'),
            fill: 'origin',
          },
          color: colors.warn,
        },
        {
          label: gs.date,
          value: gs.stats.estimatedResistant.total,
          tooltipLabel: getTooltipFormatter(_('Imunní po nemoci')),
          datasetOptions: {
            label: _('Imunní po nemoci'),
            fill: '-1',
          },
        },
      ]))),
    );

    this.immunized$ = this.immunizedChart$.pipe(
      filter(states => states.length > 0),
      map(states => states[states.length - 1]),
      map(state => state[0].value + state[1].value),
    );

    this.activeTab = 0;

    this.templateData = [
      {
        label: _('Nově nakažení'),
        svgIcon: 'virus',
        headerData$: this.infectedToday$.pipe(map(gs => last(gs)?.value)),
        prefix: '+',
        data$: this.infectedToday$,
        customOptions: null,
        pipe: [false, false],
      },
      {
        label: _('Zemřelí'),
        svgIcon: 'skull',
        headerData$: this.deathTotal$.pipe(map(gs => last(gs)?.value)),
        data$: this.deathTotal$,
        customOptions: null,
        pipe: [false, false],
      },
      {
        label: _('Celkové náklady'),
        svgIcon: 'money',
        headerData$: this.costTotal$.pipe(map(gs => last(gs)?.value)),
        data$: this.costTotal$,
        customOptions: this.costTotalCustomOptions,
        pipe: [true, true],
      },
      {
        label: _('Imunní'),
        svgIcon: 'vaccine',
        headerData$: this.immunized$,
        multiLineData$: this.immunizedChart$,
        customOptions: this.immunizedCustomOptions,
        pipe: [false, false],
      },
    ];
  }

  ngAfterViewInit() {
    this.gameService.reset$.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.dataLabelNodes = [];
    });
  }
}
