import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {Declaration} from '../utils/ng.model';
import {ColComponent} from './flex/col.component';
import {FlexItemDirective} from './flex/flex-item.directive';
import {RowComponent} from './flex/row.component';
import {SharedMaterialModule} from './shared.material.module';
import {LineGraphComponent} from '../game/chart/line-graph/line-graph.component';
import {ChartsModule} from 'ng2-charts';
import {ScatterGraphComponent} from '../game/chart/scatter-graph/scatter-graph.component';

const DECLARATIONS: Declaration[] = [
  ColComponent,
  FlexItemDirective,
  LineGraphComponent,
  RowComponent,
  ScatterGraphComponent,
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
    ChartsModule,
  ],
  exports: [
    ...DECLARATIONS,
    ReactiveFormsModule,
    SharedMaterialModule,
  ],
})
export class SharedModule {
}
