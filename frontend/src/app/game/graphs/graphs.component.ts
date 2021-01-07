import {AfterViewInit, Component} from '@angular/core';
import {FormControl} from '@angular/forms';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {ChartOptions} from 'chart.js';
import {Observable, Subscription} from 'rxjs';
import {map} from 'rxjs/operators';
import {SvgIconName} from 'src/app/shared/icon/icon.registry';
import {formatNumber} from '../../utils/format';
import {GameService} from '../game.service';
import {MitigationsService} from '../mitigations-control/mitigations.service';
import {ChartValue, colors, NodeState} from './line-graph/line-graph.component';

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
          callback(value: number | string) {
            return formatNumber(+value, false, true);
          },
        },
      }],
    },
  };

  infectedToday$: Observable<ChartValue> | undefined;
  costTotal$: Observable<ChartValue> | undefined;
  deathToday$: Observable<ChartValue> | undefined;
  immunizedChart$: Observable<ChartValue[]> | undefined;
  immunized$: Observable<number> | undefined;

  mitigations$: Subscription | undefined;
  mitigationNodes: (string | undefined)[] = [];
  templateData: any | undefined;
  activeTab = 0;

  private currentMitigation: string | undefined = undefined;

// TODO Add hysteresis maybe?
  private costTotalThresholds(value: number): NodeState {
    if (value < 10_000_000_000) return 'ok';
    if (value >= 10_000_000_000 && value < 50_000_000_000) return 'warn';
    if (value >= 50_000_000_000) return 'critical';
  }

  private deathThresholds(value: number): NodeState {
    if (value < 50) return 'ok';
    if (value >= 50 && value < 150) return 'warn';
    if (value >= 150) return 'critical';
  }

  private infectedThresholds(value: number): NodeState {
    if (value < 5_000) return 'ok';
    if (value >= 5_000 && value < 15_000) return 'warn';
    if (value >= 15_000) return 'critical';
  }

  constructor(
    public gameService: GameService,
    private mitigationsService: MitigationsService,
  ) {
    this.resetGraphsData();

    this.scopeFormControl.valueChanges.pipe(
      untilDestroyed(this),
    ).subscribe(
      newVal => this.scopeFormControl.setValue(newVal, {emitEvent: false}),
    );

    this.gameService.resetSubjects$.pipe(
      untilDestroyed(this),
    ).subscribe(_ => this.resetGraphsData());
  }

  resetGraphsData() {
    if (this.mitigations$) this.mitigations$?.unsubscribe();

    this.mitigations$ = this.gameService.gameState$.subscribe(_ => {
      this.mitigationNodes.push(
        this.currentMitigation ? this.currentMitigation : undefined,
      );

      if (this.currentMitigation) this.currentMitigation = undefined;
    });

    this.infectedToday$ = this.gameService.gameState$.pipe(map(gameState => ({
      label: gameState.date,
      value: gameState.stats.detectedInfections.today,
      tooltipLabel: (value: number) => `Nově nakažení: ${formatNumber(value)}`,
      state: this.infectedThresholds(gameState.stats.detectedInfections.today),
    })));

    this.costTotal$ = this.gameService.gameState$.pipe(map(gameState => ({
      label: gameState.date,
      value: gameState.stats.costs.total,
      tooltipLabel: (value: number) => `Celkové náklady: ${formatNumber(value, true, true)}`,
      state: this.costTotalThresholds(gameState.stats.costs.total),
    })));

    this.deathToday$ = this.gameService.gameState$.pipe(map(gameState => ({
      label: gameState.date,
      value: gameState.stats.deaths.today,
      tooltipLabel: (value: number) => `Nově zemřelí: ${formatNumber(value)}`,
      state: this.deathThresholds(gameState.stats.deaths.today),
    })));

    this.immunizedChart$ = this.gameService.gameState$.pipe(map(gs => ([
      {
        label: gs.date,
        value: Math.round(gs.sirState.resistant + gs.stats.vaccinationRate * gs.sirState.suspectible),
        tooltipLabel: (value: number) => `Imunizováni: ${formatNumber(value)}`,
      },
      {
        label: gs.date,
        value: gs.stats.vaccinationRate * Math.round(gs.sirState.suspectible),
        tooltipLabel: (value: number) => `Vakcinovaní: ${formatNumber(value)}`,
        datasetOptions: {
          backgroundColor: `${colors.critical}33`,
          borderColor: `${colors.warn}`,
        },
        color: colors.warn,
      },
    ])));

    this.immunized$ = this.gameService.gameState$.pipe(
      map(gameState => Math.round(gameState.sirState.resistant
        + gameState.stats.vaccinationRate * gameState.sirState.suspectible),
      ),
    );

    this.activeTab = 0;

    this.templateData = [
      {
        label: 'Nově nakažení',
        icon: 'virus' as SvgIconName,
        headerData$: this.infectedToday$.pipe(map(gs => gs.value)),
        data$: this.infectedToday$ as unknown as Observable<ChartValue>,
        customOptions: null,
        pipe: [false, false],
      },
      {
        label: 'Nově zemřelých',
        icon: 'skull' as SvgIconName,
        headerData$: this.deathToday$.pipe(map(gs => gs.value)),
        data$: this.deathToday$ as unknown as Observable<ChartValue>,
        customOptions: null,
        pipe: [false, false],
      },
      {
        label: 'Celkové náklady',
        icon: 'money' as SvgIconName,
        headerData$: this.costTotal$.pipe(map(gs => gs.value)),
        data$: this.costTotal$ as unknown as Observable<ChartValue>,
        customOptions: this.costTotalCustomOptions,
        pipe: [true, true],
      },
      {
        label: 'Imunní',
        icon: 'hospital' as SvgIconName,
        headerData$: this.immunized$,
        multiLineData$: this.immunizedChart$ as Observable<ChartValue[]>,
        customOptions: null,
        pipe: [false, false],
      },
    ];
  }

  ngAfterViewInit() {
    this.gameService.reset$.pipe(untilDestroyed(this)).subscribe(() => this.currentMitigation = undefined);

    for (const mitigation of Object.keys(MitigationsService.mitigationsI18n)) {
      this.mitigationsService.formGroup.get(mitigation)?.valueChanges.pipe(
        untilDestroyed(this),
      ).subscribe((value: any) => {
        // TODO add multiple mitigations at a same time
        this.currentMitigation = this.mitigationsService.getLabel(
          mitigation as keyof typeof MitigationsService.mitigationsI18n, value);
      });
    }
  }
}
