import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {GameModule} from '../../game.module';

import {SpeedControlComponent} from './speed-control.component';

describe('SpeedControlComponent', () => {
  let component: SpeedControlComponent;
  let fixture: ComponentFixture<SpeedControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GameModule,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpeedControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
