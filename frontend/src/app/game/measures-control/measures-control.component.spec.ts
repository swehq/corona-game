import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MeasuresControlComponent} from './measures-control.component';

describe('MeasuresControlComponent', () => {
  let component: MeasuresControlComponent;
  let fixture: ComponentFixture<MeasuresControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MeasuresControlComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeasuresControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
