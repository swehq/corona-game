import {Injectable} from '@angular/core';
import {Game} from '../services/game';
import {DayState} from '../services/simulation';

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

  get lastDate() {
    return this.game.lastDate;
  }

  get modelStates() {
    return this.game.simulation.modelStates;
  }

  restartSimulation(speed: Speed = 'play') {
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

    if (event) this.showEvent(event.title, event.text, gameUpdate.dayState);
  }

  showEvent(title: string, text: string, dayState: DayState) {
    this.setSpeed('pause');
    this.eventMessages.push(`${title}: ${text}`);
  }
}
