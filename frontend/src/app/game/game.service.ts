import {Injectable} from '@angular/core';
import {Game} from '../services/game';
import {Event} from '../services/events';
import {ReplaySubject, Subject} from 'rxjs';
import {scenarios} from '../services/scenario';
import {last} from 'lodash';
import {DayState} from '../services/simulation';

export type Speed = 'play' | 'pause' | 'fwd' | 'rev' | 'max';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  readonly PLAY_SPEED = 350; // ms
  readonly FORWARD_SPEED = 150; // ms
  readonly REVERSE_SPEED = 50; // ms

  game!: Game;
  event: Event | undefined;
  tickerId: number | undefined;

  private speed: Speed | undefined;
  private _speed$ = new Subject<Speed>();
  speed$ = this._speed$.asObservable();

  private _gameState$ = new ReplaySubject<DayState>();
  gameState$ = this._gameState$.asObservable();

  private _reset$ = new Subject<void>();
  reset$ = this._reset$.asObservable();

  constructor() {
    this.restartSimulation();
  }

  get lastDate() {
    return this.game.simulation.lastDate;
  }

  get modelStates() {
    return this.game.simulation.modelStates;
  }

  restartSimulation(speed: Speed = 'play', scenario: keyof typeof scenarios = 'czechiaGame') {
    this.setSpeed('pause');
    this.game = new Game(scenarios[scenario]);
    this.event = undefined;
    this._reset$.next();
    this.setSpeed(speed);
    this.showEvent(this.game.rampUpEvent);
    this.updateChart('all');
  }

  updateChart(mode: 'last' | 'all' = 'last') {
    // TODO feed all data at once in 'all' mode
    let data = this.game.simulation.modelStates;
    if (mode === 'last') {
      const lastData = last(this.game.simulation.modelStates);
      data = lastData ? [lastData] : [];
    }

    data.forEach(item => this._gameState$.next(item));
  }

  togglePause() {
    if (this.speed === 'pause') this.setSpeed('play');
    else this.setSpeed('pause');
  }

  setSpeed(speed: Speed) {
    if (this.speed === speed) return;
    if (this.tickerId) clearInterval(this.tickerId);

    this.speed = speed;
    this._speed$.next(speed);

    if (speed === 'max') {
      console.time('Computation');
      while (!this.game.isFinished()) this.tick(false);
      console.timeEnd('Computation');
    } else if (speed === 'play') {
      this.tickerId = window.setInterval(() => this.tick(), this.PLAY_SPEED);
    } else if (speed === 'fwd') {
      this.tickerId = window.setInterval(() => this.tick(), this.FORWARD_SPEED);
    } else if (speed === 'rev') {
      this.tickerId = window.setInterval(() => this.tick(), this.REVERSE_SPEED);
    }
  }

  tick(updateChart = true) {
    if (this.speed === 'rev') {
      if (this.game.canMoveBackward()) {
        this.game.moveBackward();
      } else {
        this.setSpeed('pause');
      }

      return;
    }

    if (this.game.isFinished()) {
      this.setSpeed('pause');
      return;
    }

    const gameUpdate = this.game.moveForward();
    const event = gameUpdate.event;
    this.showEvent(event);

    if (updateChart) this.updateChart();
  }

  showEvent(event: Event | undefined) {
    if (!event) return;
    if (this.speed === 'max') return;

    this.event = event;
    this.setSpeed('pause');
  }
}
