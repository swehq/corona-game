import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TestingModule} from '../../../../shared/testing/testing.module';
import {GameModule} from '../../../game.module';

import {ScatterGraphComponent} from './scatter-graph.component';

describe('ScatterGraphComponent', () => {
  let component: ScatterGraphComponent;
  let fixture: ComponentFixture<ScatterGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TestingModule,
        GameModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ScatterGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
