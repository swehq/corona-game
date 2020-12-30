import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ScatterGraphComponent} from './scatter-graph.component';

describe('ScatterGraphComponent', () => {
  let component: ScatterGraphComponent;
  let fixture: ComponentFixture<ScatterGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScatterGraphComponent ],
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
