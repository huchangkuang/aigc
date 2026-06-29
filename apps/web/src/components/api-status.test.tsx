import { render, screen, waitFor } from '@testing-library/react';
import { ApiStatus } from './api-status';
import { useAppStore } from '@/stores/app-store';

describe('ApiStatus', () => {
  beforeEach(() => {
    useAppStore.setState({ apiStatus: 'idle' });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows loading then ok when API responds successfully', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    render(<ApiStatus />);

    expect(screen.getByText(/检测中/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/已连接/)).toBeInTheDocument();
    });
  });

  it('shows error when API request fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network error'));

    render(<ApiStatus />);

    await waitFor(() => {
      expect(screen.getByText(/未连接/)).toBeInTheDocument();
    });
  });
});
