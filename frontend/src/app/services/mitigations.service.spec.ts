import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {MitigationsService} from './mitigations.service';

describe('MitigationsService', () => {
  let service: MitigationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
    });
    service = TestBed.inject(MitigationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
