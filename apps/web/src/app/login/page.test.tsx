import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const login = vi.fn();

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: { login: typeof login }) => unknown) =>
    selector({ login }),
}));

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'AIGC 工作台' })).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
  });

  it('submits credentials', () => {
    login.mockResolvedValue(undefined);
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('邮箱'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText('密码'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: '进入工作台' }));
    expect(login).toHaveBeenCalledWith('a@b.com', 'secret');
  });
});
