import {ChangeDetectorRef} from '@angular/core';
import {untilDestroyed} from '@ngneat/until-destroy';
import {BaseChartDirective} from 'ng2-charts';
import {Subject} from 'rxjs';
import {debounceTime, delay, filter, tap, withLatestFrom} from 'rxjs/operators';
import {GameService, Speed} from '../../../game.service';
import {LineGraphComponent} from './line-graph.component';

export class Pan {

  // If change, change also animation duration of indicator in line-graph.component.scss
  private readonly autoPanResetTimer = 3_000;
  panAutoReset$ = new Subject();
  panActive = false;
  minIndex = 0;
  autoResetIndicator = false;
  chart: BaseChartDirective;

  private cd: ChangeDetectorRef;
  private gameService: GameService;

  constructor(private parent: LineGraphComponent) {
    this.chart = parent.chart;
    this.cd = parent.cd;
    this.gameService = parent.gameService;
  }

  init(chart: BaseChartDirective) {
    this.chart = chart;
    this.panAutoReset$.pipe(
      withLatestFrom(this.gameService.speed$),
      filter(([_, speed]) => {
        if (this.isAutoPanDisabled(speed)) return false;
        return Boolean((this.chart?.chart as any).scales['x-axis-0']?.options.ticks.max);
      }),
      tap(() => {
        this.autoResetIndicator = false;
        this.cd.detectChanges();
      }),
      debounceTime(50),
      delay(100),
      tap(() => {
        this.autoResetIndicator = true;
        this.cd.detectChanges();
      }),
      untilDestroyed(this.parent),
    ).subscribe();

    this.gameService.speed$.pipe(untilDestroyed(this.parent)).subscribe(speed => {
      if (this.isAutoPanDisabled(speed)) this.autoResetIndicator = false;
      else if (this.panActive) this.panAutoReset$.next();
    });

    this.panAutoReset$
      .pipe(
        debounceTime(this.autoPanResetTimer),
        withLatestFrom(this.gameService.speed$),
        untilDestroyed(this.parent),
      )
      .subscribe(([_, speed]) => {
        if (this.isAutoPanDisabled(speed)) return;
        this.panActive = false;
        this.autoResetIndicator = false;
        this.minIndex = 0;
        this.parent.setXAxisTicks({max: null});
        this.parent.setScope();
      });
  }

  applyPan(direction: 'left' | 'right') {
    const addition = this.parent.scope * 0.5;
    let max;
    let min;

    if (direction === 'left') {
      this.minIndex += addition;
      [min, max] = this.panLeft();
    } else {
      this.minIndex -= addition;
      [min, max] = this.panRight();
    }

    if (max === null) {
      this.autoResetIndicator = false;
    }
    this.parent.setXAxisTicks({min, max});
    this.chart?.update();
    this.panAutoReset$.next();
    this.panActive = true;
  }

  panRight() {
    let max;
    let min;
    if (this.parent.labels.length <= this.parent.labels.length - this.minIndex) {
      min = this.parent.labels[this.parent.labels.length - this.parent.scope];
      max = null;
    } else {
      min = this.parent.labels[this.parent.labels.length - (this.parent.scope + this.minIndex)];
      max = this.parent.labels[this.parent.labels.length - this.minIndex];
    }

    return [min, max];
  }

  panLeft() {
    let max;
    let min;

    if (this.parent.labels.length < this.parent.scope + this.minIndex) {
      min = null;
      max = this.parent.labels[this.parent.scope];
    } else {
      min = this.parent.labels[this.parent.labels.length - (this.parent.scope + this.minIndex)];
      max = this.parent.labels[this.parent.labels.length - this.minIndex];
    }

    return [min, max];
  }

  reset() {
    this.minIndex = 0;
    this.panActive = false;
    this.autoResetIndicator = false;
    this.parent.setScope(this.parent.scope);
  }

  getDisability(side: 'left' | 'right') {
    const chart = this.chart?.chart as any;
    const chartTicks = chart?.scales['x-axis-0']?.options.ticks;
    if (!chartTicks) return true;

    const lastTick = this.parent.labels[this.parent.labels.length - 1];
    return side === 'right'
      ? !chartTicks.max || chartTicks.max === lastTick
      : !chartTicks.min || chartTicks.min === this.parent.labels[0];
  }

  private isAutoPanDisabled(speed: Speed) {
    return speed === 'pause' || speed === 'finished';
  }
}
