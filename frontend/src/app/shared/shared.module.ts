import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatIconRegistry} from '@angular/material/icon';
import {DomSanitizer} from '@angular/platform-browser';
import {RouterModule} from '@angular/router';
import {Declaration} from '../utils/ng.model';
import {ButtonComponent} from './button/button.component';
import {ColComponent} from './flex/col.component';
import {FlexItemDirective} from './flex/flex-item.directive';
import {RowComponent} from './flex/row.component';
import {IconComponent} from './icon/icon.component';
import {initIconRegistry} from './icon/icon.registry';
import {SharedMaterialModule} from './shared-material.module';

const DECLARATIONS: Declaration[] = [
  ButtonComponent,
  ColComponent,
  FlexItemDirective,
  IconComponent,
  RowComponent,
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
  ],
  exports: [
    ...DECLARATIONS,
    ReactiveFormsModule,
    SharedMaterialModule,
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
