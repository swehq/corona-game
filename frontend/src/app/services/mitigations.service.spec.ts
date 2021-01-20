import {TestBed} from '@angular/core/testing';
import {MitigationsService} from './mitigations.service';
import {TestingModule} from '../shared/testing/testing.module';

describe('MitigationsService', () => {
  let service: MitigationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TestingModule,
      ],
    });
    service = TestBed.inject(MitigationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
