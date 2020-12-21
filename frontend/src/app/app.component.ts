import {Component, OnInit} from '@angular/core';
import {Game} from './services/game';

type Speed = 'play' | 'pause' | 'fwd' | 'rev';

@Component({
  selector: 'cvd-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  readonly PLAY_SPEED = 350; // ms
  readonly FORWARD_SPEED = 150; // ms
  readonly REVERSE_SPEED = 50; // ms

  game = new Game();
  eventMessage = '';
  speed: Speed = 'pause';
  tickerId: number | undefined;

  constructor() {
    this.restartSimulation();
  }

  ngOnInit() {
    this.setSpeed('play');
  }

  restartSimulation() {
    this.setSpeed('pause');
    this.game = new Game();
    this.setSpeed('play');
  }

  setSpeed(speed: Speed) {
    if (this.speed === speed) return;
    if (this.tickerId) clearInterval(this.tickerId);

    this.speed = speed;

    if (speed === 'play') {
      this.tickerId = window.setInterval(() => this.tick(), this.PLAY_SPEED);
    } else if (speed === 'fwd') {
      this.tickerId = window.setInterval(() => this.tick(), this.FORWARD_SPEED);
    } else if (speed === 'rev') {
      this.tickerId = window.setInterval(() => this.tick(), this.REVERSE_SPEED);
    }
  }

  tick() {
    if (this.speed !== 'rev') {
      if (this.game.getSimStats().length <= 1) {
        this.setSpeed('pause');
      } else {
        this.game.moveBackward();
      }

      return;
    }

    if (this.game.isFinished()) return;

    // TODO reflect form
    // updateMitigationState();

    const gameUpdate = this.game.moveForward();
    if (!gameUpdate) return;

    const event = gameUpdate.event;

    if (event) this.showEvent(event.title, event.text, gameUpdate.dayStats);
  }

  showEvent(title: string, text: string, dayStats: any) {
    this.setSpeed('pause');
    this.eventMessage = `${title}, ${text}, ${dayStats}`;
  }
}
