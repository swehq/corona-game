import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SimulationControlComponent} from './simulation-control.component';
import {TestingModule} from '../../../shared/testing/testing.module';

describe('SimulationControlComponent', () => {
  let component: SimulationControlComponent;
  let fixture: ComponentFixture<SimulationControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestingModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SimulationControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
