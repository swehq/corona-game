import {ComponentFixture, TestBed} from '@angular/core/testing';
import {GraphsComponent} from './graphs.component';
import {TestingModule} from '../../../shared/testing/testing.module';
import {registerLocaleData} from '@angular/common';
import cs from '@angular/common/locales/cs';

registerLocaleData(cs);

describe('GraphsComponent', () => {
  let component: GraphsComponent;
  let fixture: ComponentFixture<GraphsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestingModule,
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GraphsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
