import {Component} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'cvd-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  constructor(private router: Router) {
  }

  backToGame() {
    this.router.navigate(['/']);
  }
}
