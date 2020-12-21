import {Component, OnInit} from '@angular/core';
import {Game} from 'src/app/services/game';
import {DayState} from 'src/app/services/simulation';

type Speed = 'play' | 'pause' | 'fwd' | 'rev' | 'max';

@Component({
  selector: 'cvd-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {
  readonly PLAY_SPEED = 350; // ms
  readonly FORWARD_SPEED = 150; // ms
  readonly REVERSE_SPEED = 50; // ms

  game = new Game();
  eventMessages: string[] = [];
  speed: Speed = 'pause';
  tickerId: number | undefined;

  constructor() {
    this.restartSimulation();
  }

  ngOnInit() {
    this.setSpeed('play');
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

  download() {
    const element = document.createElement('a');
    element.style.display = 'none';

    const data = JSON.stringify(this.game.simulation.modelStates, null, 2);
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', 'data.json');

    document.body.appendChild(element);
    element.click();

    document.body.removeChild(element);
  }
}
