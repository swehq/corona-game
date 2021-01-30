import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {AutofocusDirective} from '../directives/autofocus.directive';
import {FormatNumberPipe} from '../pipes/format-number.pipe';
import {FormatPercentagePipe} from '../pipes/format-percentage.pipe';
import {Declaration} from '../utils/ng.model';
import {ButtonComponent} from './button/button.component';
import {ColComponent} from './flex/col.component';
import {FlexItemDirective} from './flex/flex-item.directive';
import {RowComponent} from './flex/row.component';
import {FooterComponent} from './footer/footer.component';
import {HeaderComponent} from './header/header.component';
import {HelpTooltipComponent} from './help-tooltip/help-tooltip.component';
import {IconComponent} from './icon/icon.component';
import {initIconRegistry} from './icon/icon.registry';
import {LanguagePickerComponent} from './language-picker/language-picker.component';
import {NavigateBackDirective} from './navigate-back/navigate-back.directive';
import {SharedMaterialModule} from './shared-material.module';

const DECLARATIONS: Declaration[] = [
  ButtonComponent,
  ColComponent,
  FlexItemDirective,
  HeaderComponent,
  FooterComponent,
  FormatNumberPipe,
  FormatPercentagePipe,
  HelpTooltipComponent,
  IconComponent,
  LanguagePickerComponent,
  NavigateBackDirective,
  RowComponent,
  AutofocusDirective,
];

@NgModule({
  declarations: [
    ...DECLARATIONS,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    SharedMaterialModule,
    TranslateModule,
  ],
  exports: [
    ...DECLARATIONS,
    ReactiveFormsModule,
    SharedMaterialModule,
    TranslateModule,
  ],
})
export class SharedModule {
  constructor(
    iconRegistry: MatIconRegistry,
    domSanitizer: DomSanitizer,
  ) {
    initIconRegistry(iconRegistry, domSanitizer);
  }
}
