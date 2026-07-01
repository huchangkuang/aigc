import { AssetController } from '../asset.controller';
import { AssetService } from '../asset.service';
import { StorageService } from '../../storage/storage.service';

describe('AssetController', () => {
  const assets = {
    listForUser: jest.fn(),
    listTrashForUser: jest.fn(),
    getForUser: jest.fn(),
    getDownloadUrl: jest.fn(),
    renameForUser: jest.fn(),
    softDeleteForUser: jest.fn(),
    restoreForUser: jest.fn(),
    destroyForUser: jest.fn(),
    getComposeContext: jest.fn(),
  };
  const storage = {
    getSignedUrl: jest.fn(),
  };
  const controller = new AssetController(
    assets as unknown as AssetService,
    storage as unknown as StorageService,
  );
  const req = { user: { id: 'u1', email: 'a@b.com' } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /assets returns list with preview urls', async () => {
    assets.listForUser.mockResolvedValue([
      { id: 'a1', ossKey: 'assets/u1/a1.png' },
    ]);
    storage.getSignedUrl.mockResolvedValue('https://signed');

    await expect(controller.list(req as never)).resolves.toEqual([
      { id: 'a1', ossKey: 'assets/u1/a1.png', previewUrl: 'https://signed' },
    ]);
  });

  it('PATCH /assets/:id renames asset', async () => {
    assets.renameForUser.mockResolvedValue({ id: 'a1', metadata: { title: '新标题' } });

    await expect(
      controller.rename(req as never, 'a1', { title: '新标题' }),
    ).resolves.toEqual({ id: 'a1', metadata: { title: '新标题' } });
    expect(assets.renameForUser).toHaveBeenCalledWith('u1', 'a1', '新标题');
  });

  it('DELETE /assets/:id soft deletes asset', async () => {
    assets.softDeleteForUser.mockResolvedValue({ id: 'a1' });

    await expect(controller.remove(req as never, 'a1')).resolves.toEqual({ id: 'a1' });
    expect(assets.softDeleteForUser).toHaveBeenCalledWith('u1', 'a1');
  });

  it('GET /assets/:id/compose-context returns compose context', async () => {
    assets.getComposeContext.mockResolvedValue({
      assetId: 'a1',
      prompt: '小猫',
      imageUrls: ['https://fresh/ref.png'],
      generationType: 'video_i2v_first',
    });

    await expect(controller.getComposeContext(req as never, 'a1')).resolves.toEqual({
      assetId: 'a1',
      prompt: '小猫',
      imageUrls: ['https://fresh/ref.png'],
      generationType: 'video_i2v_first',
    });
  });

  it('GET /assets/trash returns trashed list with preview urls', async () => {
    assets.listTrashForUser.mockResolvedValue([
      { id: 'a1', ossKey: 'assets/u1/a1.png', deletedAt: new Date() },
    ]);
    storage.getSignedUrl.mockResolvedValue('https://signed');

    await expect(controller.listTrash(req as never)).resolves.toEqual([
      {
        id: 'a1',
        ossKey: 'assets/u1/a1.png',
        deletedAt: expect.any(Date),
        previewUrl: 'https://signed',
      },
    ]);
  });

  it('POST /assets/:id/restore restores asset', async () => {
    assets.restoreForUser.mockResolvedValue({ id: 'a1', deletedAt: null });

    await expect(controller.restore(req as never, 'a1')).resolves.toEqual({
      id: 'a1',
      deletedAt: null,
    });
    expect(assets.restoreForUser).toHaveBeenCalledWith('u1', 'a1');
  });

  it('DELETE /assets/:id/permanent destroys asset', async () => {
    assets.destroyForUser.mockResolvedValue({ id: 'a1' });

    await expect(controller.destroyPermanent(req as never, 'a1')).resolves.toEqual({
      id: 'a1',
    });
    expect(assets.destroyForUser).toHaveBeenCalledWith('u1', 'a1');
  });
});
