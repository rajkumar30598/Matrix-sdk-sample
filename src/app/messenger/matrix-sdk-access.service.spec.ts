import { TestBed } from '@angular/core/testing';

import { MatrixSdkAccessService } from './matrix-sdk-access.service';

describe('MatrixSdkAccessService', () => {
  let service: MatrixSdkAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatrixSdkAccessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
