import { Test, TestingModule } from '@nestjs/testing';
import { DokumenService } from './dokumen.service';

describe('DokumenService', () => {
  let service: DokumenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DokumenService],
    }).compile();

    service = module.get<DokumenService>(DokumenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
