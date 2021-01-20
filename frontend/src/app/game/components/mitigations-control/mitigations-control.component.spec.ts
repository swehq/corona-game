import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MitigationsControlComponent} from './mitigations-control.component';
import {TestingModule} from '../../../shared/testing/testing.module';

describe('MitigationsControlComponent', () => {
  let component: MitigationsControlComponent;
  let fixture: ComponentFixture<MitigationsControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestingModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitigationsControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
