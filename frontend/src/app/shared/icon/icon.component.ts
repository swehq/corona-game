import {Component, HostBinding, Input, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeValue} from '@angular/platform-browser';

export type IconSize = 'tiny' | 'small' | 'default' | 'large';

@Component({
  selector: 'cvd-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
})
export class IconComponent {
  @Input() svgIcon = '';

  @Input() set color(newColor: string) { this._color = this.domSanitizer.sanitize(SecurityContext.STYLE, newColor); }
  @HostBinding('style.color') private _color: string | null = null;

  @Input() size: IconSize = 'default';
  @HostBinding('class.small') get isSmall() { return this.size === 'small'; }
  @HostBinding('class.large') get isLarge() { return this.size === 'large'; }

  constructor(
    private domSanitizer: DomSanitizer,
  ) {
  }
}
