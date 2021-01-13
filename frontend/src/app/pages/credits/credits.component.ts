import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'cvd-credits',
  templateUrl: './credits.component.html',
  styleUrls: ['./credits.component.scss']
})
export class CreditsComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  backToGame() {
    this.router.navigate(['/']);
  }
}
