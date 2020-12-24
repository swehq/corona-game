import {Component, Input, OnInit} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {LineNode, NodeState} from './line-graph/line-graph.component';
import {
  BusinessesLevel,
  EventsLevel,
  mitigationsI18n,
  MitigationsService,
  SchoolsLevel
} from '../mitigations-control/mitigations.service';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {filter} from 'rxjs/operators';
import {GameService} from '../game.service';

export interface Serie {
  label: string;
  color?: string;
  unit?: string;
}

export interface ChartValue {
  label: string | Date;
  value: number;
}

@UntilDestroy()
@Component({
  selector: 'cvd-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {
  @Input()
  series: Serie[] = [{label: ''}];

  @Input()
  tick$!: Observable<ChartValue>;

  currentState: NodeState = 'ok';
  currentEvent: string | undefined = undefined;
  data$ = new Subject<LineNode>();

  constructor(private mitigationsService: MitigationsService, public gameService: GameService) { }

  ngOnInit() {
    this.tick$.pipe(
      untilDestroyed(this)
    ).subscribe(tick => {
      this.data$.next({
        value: tick.value,
        label: typeof tick.label === 'string' ? tick.label : tick.label.toLocaleDateString(),
        event: this.currentEvent,
        state: this.currentState,
      });

      // TODO focus more on logic of showing mitigations!
      if (this.currentEvent) this.currentEvent = undefined;
    });

    this.gameService.reset$.pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.currentState = 'ok';
      this.currentEvent = undefined;
    });

    // TODO add multiple mitigations at a same time
    this.mitigationsService.formGroup.get('bordersClosed')?.valueChanges.pipe(
      filter(value => value),
      untilDestroyed(this),
    ).subscribe(() => {
      // TODO add "canceled restrictions" event
      this.currentEvent = mitigationsI18n.bordersClosed;
    });

    this.mitigationsService.formGroup.get('businesses')?.valueChanges.pipe(
      filter(value => value),
      untilDestroyed(this),
    ).subscribe((value: BusinessesLevel) => {
      // TODO add "canceled restrictions" event
      this.currentEvent = mitigationsI18n[value!];
    });

    this.mitigationsService.formGroup.get('events')?.valueChanges.pipe(
      filter(value => value),
      untilDestroyed(this),
    ).subscribe((value: EventsLevel) => {
      // TODO add "canceled restrictions" event
      this.currentEvent = mitigationsI18n[value!];
    });

    this.mitigationsService.formGroup.get('rrr')?.valueChanges.pipe(
      filter(value => value),
      untilDestroyed(this),
    ).subscribe(() => {
      // TODO add "canceled restrictions" event
      this.currentEvent = mitigationsI18n.rrr;
    });

    this.mitigationsService.formGroup.get('schools')?.valueChanges.pipe(
      filter(value => value),
      untilDestroyed(this),
    ).subscribe((value: SchoolsLevel) => {
      // TODO add "canceled restrictions" event
      this.currentEvent = mitigationsI18n[value!];
    });

    this.mitigationsService.formGroup.get('stayHome')?.valueChanges.pipe(
      filter(value => value),
      untilDestroyed(this),
    ).subscribe(() => {
      // TODO add "canceled restrictions" event
      this.currentEvent = mitigationsI18n.stayHome;
    });
  }
}
