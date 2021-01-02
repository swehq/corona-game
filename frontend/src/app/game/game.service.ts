import {Injectable} from '@angular/core';
import {Game} from '../services/game';
import {Subject} from 'rxjs';
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
  eventMessages: string[] = [];
  tickerId: number | undefined;

  private speed: Speed | undefined;
  private _speed$ = new Subject<Speed>();
  speed$ = this._speed$.asObservable();

  private _gameState$ = new Subject<DayState>();
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
    this._reset$.next();
    this.eventMessages = [];
    this.setSpeed(speed);
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

    this.speed = speed;
    this._speed$.next(speed);
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

    if (event) this.showEvent(event.title, event.text);
    if (updateChart) this.updateChart();
  }

  showEvent(title: string, text: string) {
    this.setSpeed('pause');
    this.eventMessages.push(`${title}: ${text}`);
  }
}
