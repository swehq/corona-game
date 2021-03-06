import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TestingModule} from '../../../shared/testing/testing.module';
import {GameModule} from '../../game.module';
import {CreditsComponent} from './credits.component';

describe('CreditsComponent', () => {
  let component: CreditsComponent;
  let fixture: ComponentFixture<CreditsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestingModule,
        GameModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
