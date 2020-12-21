import {TestBed} from '@angular/core/testing';
import {MitigationsService} from './mitigations.service';

describe('MitigationsService', () => {
  let service: MitigationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MitigationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
