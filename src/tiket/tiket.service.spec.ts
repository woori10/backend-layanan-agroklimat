import { Test, TestingModule } from '@nestjs/testing';
import { TiketService } from './tiket.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TiketService', () => {
  let service: TiketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiketService,
        {
          provide: PrismaService,
          useValue: {
            layanan: {
              findUnique: jest.fn(),
            },
            tiket: {
              count: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TiketService>(TiketService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
