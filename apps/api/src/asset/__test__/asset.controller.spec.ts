import { AssetController } from '../asset.controller';
import { AssetService } from '../asset.service';
import { StorageService } from '../../storage/storage.service';

describe('AssetController', () => {
  const assets = {
    listForUser: jest.fn(),
    getForUser: jest.fn(),
    getDownloadUrl: jest.fn(),
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
});
