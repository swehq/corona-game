import {ComponentFixture, TestBed} from '@angular/core/testing';
import {GameModule} from '../../game/game.module';
import {HelpTooltipComponent} from './help-tooltip.component';

describe('HelpTooltipComponent', () => {
  let component: HelpTooltipComponent;
  let fixture: ComponentFixture<HelpTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        GameModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
