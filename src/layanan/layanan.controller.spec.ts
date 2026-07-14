import { Test, TestingModule } from '@nestjs/testing';
import { LayananController } from './layanan.controller';

describe('LayananController', () => {
  let controller: LayananController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LayananController],
    }).compile();

    controller = module.get<LayananController>(LayananController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
