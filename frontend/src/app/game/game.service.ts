import {Injectable} from '@angular/core';
import {Game} from '../services/game';
import {Subject} from 'rxjs';
import {ChartValue} from './chart/chart.component';
import {scenarios} from '../services/scenario';

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

  private _infectedToday$ = new Subject<ChartValue>();
  infectedToday$ = this._infectedToday$.asObservable();

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

    const chartData = this.game.simulation.modelStates.map(s => ({
      label: s.date,
      value: s.stats.detectedInfections.today,
    }));
    chartData.forEach(i => this._infectedToday$.next(i));
    this.setSpeed(speed);
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
      while (!this.game.isFinished()) this.tick();
      console.timeLog('Computation');
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

  tick() {
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

    this._infectedToday$.next({
      label: gameUpdate.dayState.date,
      value: gameUpdate.dayState.stats.detectedInfections.today,
    });
  }

  showEvent(title: string, text: string) {
    this.setSpeed('pause');
    this.eventMessages.push(`${title}: ${text}`);
  }
}
