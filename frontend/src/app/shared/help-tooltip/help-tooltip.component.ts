import {Component, EventEmitter, Output} from '@angular/core';
import {inOutAnimation, scaleAnimation} from 'src/app/utils/animations';

@Component({
  selector: 'cvd-help-tooltip',
  templateUrl: './help-tooltip.component.html',
  styleUrls: ['./help-tooltip.component.scss'],
  animations: [
    scaleAnimation,
    inOutAnimation('400ms'),
  ],
})
export class HelpTooltipComponent {
  @Output()
  changeCurrentState = new EventEmitter<boolean>();

  isVisible = false;

  toggleState() {
    this.isVisible = !this.isVisible;

    this.changeCurrentState.emit(this.isVisible);
  }
}
