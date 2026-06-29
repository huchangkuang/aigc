import { GenerationController } from '../generation.controller';
import { GenerationTaskService } from '../generation-task.service';

describe('GenerationController', () => {
  const tasks = {
    create: jest.fn(),
    listForUser: jest.fn(),
    getForUser: jest.fn(),
  };
  const controller = new GenerationController(
    tasks as unknown as GenerationTaskService,
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

  it('GET lists tasks for user', async () => {
    tasks.listForUser.mockResolvedValue([{ id: 't1' }]);
    await expect(controller.list(req as never)).resolves.toEqual([{ id: 't1' }]);
  });
});
