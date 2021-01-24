import {Component, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatRipple} from '@angular/material/core';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {of, Subject, timer} from 'rxjs';
import {filter, switchMap, takeUntil, tap} from 'rxjs/operators';
import {SvgIconName} from '../../../shared/icon/icon.registry';
import {GameService, Speed} from '../../game.service';

@UntilDestroy()
@Component({
  selector: 'cvd-speed-control',
  templateUrl: './speed-control.component.html',
  styleUrls: ['./speed-control.component.scss'],
  providers: [{provide: NG_VALUE_ACCESSOR, useExisting: SpeedControlComponent, multi: true}],
})
export class SpeedControlComponent implements OnChanges, ControlValueAccessor {
  private stopRipple$ = new Subject<undefined>();
  levels: {speed: Speed, icon: SvgIconName}[] = [
    {speed: 'pause', icon: 'pause'},
    {speed: 'slow', icon: 'oneSpeed'},
    {speed: 'play', icon: 'twoSpeed'},
    {speed: 'fast', icon: 'threeSpeed'},
  ];

  @ViewChild(MatRipple)
  private ripple: MatRipple | undefined;

  launchRipple() {
    if (!this.ripple) return;
    this.ripple.launch({animation: {
      enterDuration: 500,
      exitDuration: 1000,
    }});
  }
  @ViewChild('group') group: MatButtonToggleGroup | null = null;

  value: Speed = 'play';
  disabled = false;

  constructor(gameService: GameService) {
    gameService.speed$.pipe(
      filter(s => s === 'pause'),
      switchMap(() => {
        if (gameService.eventQueue.length) return of(null);
        return timer(1000, 2500);
      }),
      filter(i => i !== null),
      tap(() => this.launchRipple()),
      takeUntil(this.stopRipple$),
      untilDestroyed(this),
    ).subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.levels) {
      this.writeValue(this.value);
    }
  }

  onUserAction(value: any) {
    this.stopRipple$.next();
    this.stopRipple$.complete();
    this.value = value;
    this.onChange(this.value);
  }

  registerOnChange(cb: (_: any) => void) {
    this.onChange = cb;
  }

  registerOnTouched(_: any) {
  }

  onChange = (_: any) => {
  }

  writeValue(value: any) {
    this.value = value;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled = isDisabled;
  }
}
