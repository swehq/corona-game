import {ComponentFixture, TestBed} from '@angular/core/testing';
import {EMPTY} from 'rxjs';
import {LineGraphComponent} from './line-graph.component';
import {TestingModule} from '../../../../shared/testing/testing.module';

describe('LineComponent', () => {
  let component: LineGraphComponent;
  let fixture: ComponentFixture<LineGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestingModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LineGraphComponent);
    component = fixture.componentInstance;
    component.singleLineTick$ = EMPTY;
    component.multiLineTick$ = EMPTY;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
