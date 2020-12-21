import {TestBed} from '@angular/core/testing';
import {MeasuresService} from './measures.service';

describe('MeasuresService', () => {
  let service: MeasuresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeasuresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
