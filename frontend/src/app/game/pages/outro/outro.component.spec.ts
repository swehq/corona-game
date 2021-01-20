import {ComponentFixture, TestBed} from '@angular/core/testing';
import {OutroComponent} from './outro.component';
import {TestingModule} from '../../../shared/testing/testing.module';

describe('OutroComponent', () => {
  let component: OutroComponent;
  let fixture: ComponentFixture<OutroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestingModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OutroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
