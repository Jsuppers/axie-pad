import { TestBed } from '@angular/core/testing';

import { ScholarService } from './scholar.service';

describe('ScholarService', () => {
  let service: ScholarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScholarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
