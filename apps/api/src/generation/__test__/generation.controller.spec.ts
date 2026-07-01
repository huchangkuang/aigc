import { GenerationController } from '../generation.controller';
import { GenerationTaskService } from '../generation-task.service';
import { StorageService } from '../../storage/storage.service';

describe('GenerationController', () => {
  const tasks = {
    create: jest.fn(),
    listForUser: jest.fn(),
    listActiveForUser: jest.fn(),
    getForUser: jest.fn(),
  };
  const storage = {
    getSignedUrl: jest.fn(),
  };
  const controller = new GenerationController(
    tasks as unknown as GenerationTaskService,
    storage as unknown as StorageService,
  );
  const req = { user: { id: 'u1', email: 'a@b.com' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST delegates to service', async () => {
    tasks.create.mockResolvedValue({ id: 't1' });
    await expect(
      controller.create(req as never, {
        type: 'video_t2v',
        prompt: 'hello',
      }),
    ).resolves.toEqual({ id: 't1' });
    expect(tasks.create).toHaveBeenCalledWith('u1', {
      type: 'video_t2v',
      prompt: 'hello',
    });
  });

  it('GET lists tasks for user with signed asset urls', async () => {
    tasks.listForUser.mockResolvedValue([
      {
        id: 't1',
        assets: [{ id: 'a1', ossKey: 'assets/u1/a1.png' }],
      },
    ]);
    storage.getSignedUrl.mockResolvedValue('https://signed.example/a1.png');

    await expect(controller.list(req as never)).resolves.toEqual([
      {
        id: 't1',
        assets: [
          {
            id: 'a1',
            ossKey: 'assets/u1/a1.png',
            previewUrl: 'https://signed.example/a1.png',
          },
        ],
      },
    ]);
  });

  it('GET active lists only pending/processing tasks without signed urls', async () => {
    tasks.listActiveForUser.mockResolvedValue([
      {
        id: 't1',
        status: 'processing',
        errorMessage: null,
        type: 'video_t2v',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    await expect(controller.listActive(req as never)).resolves.toEqual([
      {
        id: 't1',
        status: 'processing',
        errorMessage: null,
        type: 'video_t2v',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    expect(tasks.listActiveForUser).toHaveBeenCalledWith('u1');
    expect(storage.getSignedUrl).not.toHaveBeenCalled();
  });
});
