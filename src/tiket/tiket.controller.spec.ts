import { Test, TestingModule } from '@nestjs/testing';
import { TiketController } from './tiket.controller';
import { TiketService } from './tiket.service';

describe('TiketController', () => {
  let controller: TiketController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiketController],
      providers: [
        {
          provide: TiketService,
          useValue: {
            create: jest.fn(),
            findAllByUser: jest.fn(),
            findOneByUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TiketController>(TiketController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
