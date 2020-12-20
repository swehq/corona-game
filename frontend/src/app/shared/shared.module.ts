import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {Declaration} from '../utils/ng.model';
import {ColComponent} from './flex/col.component';
import {FlexItemDirective} from './flex/flex-item.directive';
import {RowComponent} from './flex/row.component';
import {SharedMaterialModule} from './shared-material.module';

const DECLARATIONS: Declaration[] = [
  ColComponent,
  FlexItemDirective,
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
}
