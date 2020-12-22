import {Injectable} from '@angular/core';
import {Game} from '../services/game';
import {DayState} from '../services/simulation';
import {BehaviorSubject, Subject} from 'rxjs';

export type Speed = 'play' | 'pause' | 'fwd' | 'rev' | 'max';

@Injectable({
  providedIn: 'root',
})
export class GameService {

  readonly PLAY_SPEED = 350; // ms
  readonly FORWARD_SPEED = 150; // ms
  readonly REVERSE_SPEED = 50; // ms

  game = new Game();
  eventMessages: string[] = [];
  speed: Speed = 'pause';
  tickerId: number | undefined;


  private _infectedToday$ = new BehaviorSubject<number>(0);
  infectedToday$ = this._infectedToday$.asObservable();

  private _deathsToday$ = new BehaviorSubject<number>(0);
  deathsToday$ = this._deathsToday$.asObservable();

  private _reset$ = new Subject<void>();
  reset$ = this._reset$.asObservable();

  get lastDate() {
    return this.game.lastDate;
  }

  get modelStates() {
    return this.game.simulation.modelStates;
  }

  restartSimulation(speed: Speed = 'play') {
    this._reset$.next();
    this.setSpeed('pause');
    this.eventMessages = [];
    this.game = new Game();
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
  }

  tick() {
    if (this.speed === 'rev') {
      if (this.game.simulation.modelStates.length <= 1) {
        this.setSpeed('pause');
      } else {
        this.game.moveBackward();
      }

      return;
    }

    if (this.game.isFinished()) {
      this.setSpeed('pause');
      return;
    }

    // TODO reflect form
    // updateMitigationState();

    const gameUpdate = this.game.moveForward();
    const event = gameUpdate.event;

    this._infectedToday$.next(Math.floor(gameUpdate.dayState.infectedToday));
    this._deathsToday$.next(Math.floor(gameUpdate.dayState.deathsToday));

    if (event) this.showEvent(event.title, event.text, gameUpdate.dayState);
  }

  showEvent(title: string, text: string, dayState: DayState) {
    this.setSpeed('pause');
    this.eventMessages.push(`${title}: ${text}`);
  }
}
