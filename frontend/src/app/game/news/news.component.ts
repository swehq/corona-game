import {Component} from '@angular/core';
import {GameService} from '../game.service';

@Component({
  selector: 'cvd-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent {
  constructor(
    public gameService: GameService,
  ) {
  }
}
