import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {GameModule} from '../../game.module';
import {MitigationsControlComponent} from './mitigations-control.component';

describe('MitigationsControlComponent', () => {
  let component: MitigationsControlComponent;
  let fixture: ComponentFixture<MitigationsControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        GameModule,
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
