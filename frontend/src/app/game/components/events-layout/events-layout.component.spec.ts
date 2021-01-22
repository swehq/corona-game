import {ComponentFixture, TestBed} from '@angular/core/testing';
import {EventsLayoutComponent} from './events-layout.component';
import {TestingModule} from '../../../shared/testing/testing.module';

describe('EventsLayoutComponent', () => {
  let component: EventsLayoutComponent;
  let fixture: ComponentFixture<EventsLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestingModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
