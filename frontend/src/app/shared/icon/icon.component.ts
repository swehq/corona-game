import {Component, HostBinding, Input, SecurityContext} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

export type IconSize = 'tiny' | 'small' | 'default' | 'large';

@Component({
  selector: 'cvd-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
})
export class IconComponent {
  @Input() svgIcon = '';
  @Input() set color(newColor: string) { this.domSanitizer.sanitize(SecurityContext.STYLE, newColor); }

  @Input() size: IconSize = 'default';
  @HostBinding('class.small') get isSmall() { return this.size === 'small'; }
  @HostBinding('class.large') get isLarge() { return this.size === 'large'; }

  constructor(
    private domSanitizer: DomSanitizer,
  ) {
  }
}
