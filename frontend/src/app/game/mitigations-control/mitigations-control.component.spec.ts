import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MitigationsControlComponent} from './mitigations-control.component';

describe('MitigationsControlComponent', () => {
  let component: MitigationsControlComponent;
  let fixture: ComponentFixture<MitigationsControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MitigationsControlComponent]
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
