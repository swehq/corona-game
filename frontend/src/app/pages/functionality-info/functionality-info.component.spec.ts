import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FunctionalityInfoComponent} from './functionality-info.component';

describe('FunctionalityInfoComponent', () => {
  let component: FunctionalityInfoComponent;
  let fixture: ComponentFixture<FunctionalityInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FunctionalityInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FunctionalityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
