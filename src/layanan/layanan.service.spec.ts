import { Test, TestingModule } from '@nestjs/testing';
import { LayananService } from './layanan.service';

describe('LayananService', () => {
  let service: LayananService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LayananService],
    }).compile();

    service = module.get<LayananService>(LayananService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
