import { useAppStore } from '../app-store';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({ apiStatus: 'idle' });
  });

  it('defaults apiStatus to idle', () => {
    expect(useAppStore.getState().apiStatus).toBe('idle');
  });

  it('updates apiStatus via setApiStatus', () => {
    useAppStore.getState().setApiStatus('ok');
    expect(useAppStore.getState().apiStatus).toBe('ok');
  });
});
