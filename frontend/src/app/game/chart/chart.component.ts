import {Component, Input} from '@angular/core';
import {Subject} from 'rxjs';
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

@UntilDestroy()
@Component({
  selector: 'cvd-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent {
  @Input()
  series: Serie[] = [{label: ''}];

  @Input()
  set tick(tick: number) {
    const tickE: LineNode = {value: tick, event: this.currentEvent, state: this.currentState};
    this.data$.next({value: tickE.value, event: tickE.event, state: tickE.state});

    // TODO focus more on logic of showing mitigations!
    if (this.currentEvent) this.currentEvent = undefined;
  }

  currentState: NodeState = 'ok';
  currentEvent: string | undefined = undefined;
  data$ = new Subject<LineNode>();

  constructor(private mitigationsService: MitigationsService, public gameService: GameService) {
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
