'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { useAuthStore } from '@/stores/auth-store';

const BG_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAnTZMCDIKvlmgfSigofF8eDm6Lbx7bCi89_syn9Njhg-os_qY_N0L6i4f_bq06bafI8I1Rx0Wrz9DqcjXWbwUSYMv7QyktQ5Pif6LthT38K_ry8k4ebcwWxjRNFCp1iotcdDXWBkNo-fyvG2Emt5AnK_dSJq0alYm9lPJnXbnrog7GFrlMsCT0Y0hFADtMRKc7ZhWI9upmqXXBhuLRtyio_FlGn8rRbn3z97JKQI27umD08t9to9QCnFijMPGurBwjs0d72Ak7pAHs';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0, visible: false });

  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      setCursorGlow({
        x: event.clientX - 200,
        y: event.clientY - 200,
        visible: true,
      });
    }

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/generate');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-on-background">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-background to-primary/5" />
        <div className="absolute -left-[10%] -top-[20%] h-[60%] w-[60%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[60%] w-[60%] rounded-full bg-secondary/10 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-full w-full opacity-20">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${BG_IMAGE}')` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex w-full max-w-[1280px] items-center justify-center px-gutter">
        <div className="animate-float w-full max-w-[480px]">
          {/* Branding Header */}
          <div className="mb-xl text-center">
            <div className="mb-base inline-flex items-center gap-sm">
              <Icon name="auto_awesome" filled className="text-[40px] text-primary" />
              <h1 className="text-display-lg tracking-tighter text-primary">AIGC 工作台</h1>
            </div>
            <p className="text-body-lg mx-auto max-w-[320px] text-on-surface-variant">
              面向专业创作者与 Prompt 工程师的 AI 素材工作台
            </p>
          </div>

          {/* Login Card */}
          <div className="glass-panel group relative overflow-hidden rounded-xl p-xl shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <form className="space-y-md" onSubmit={onSubmit}>
              {/* Email Field */}
              <div className="space-y-xs">
                <label
                  htmlFor="email"
                  className="text-label-sm pl-xs tracking-widest text-on-surface-variant"
                >
                  邮箱
                </label>
                <div className="glow-border relative rounded-lg border border-outline-variant">
                  <Icon
                    name="alternate_email"
                    className="absolute left-base top-1/2 -translate-y-1/2 text-[20px] text-outline"
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-code-md w-full border-none bg-transparent py-base pl-xl text-on-surface placeholder:text-outline-variant focus:ring-0"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-xs">
                <div className="flex items-end justify-between pl-xs">
                  <label
                    htmlFor="password"
                    className="text-label-sm tracking-widest text-on-surface-variant"
                  >
                    密码
                  </label>
                  <button
                    type="button"
                    className="text-label-sm text-primary transition-all hover:underline"
                    tabIndex={-1}
                  >
                    找回密码？
                  </button>
                </div>
                <div className="glow-border relative rounded-lg border border-outline-variant">
                  <Icon
                    name="lock"
                    className="absolute left-base top-1/2 -translate-y-1/2 text-[20px] text-outline"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-code-md w-full border-none bg-transparent py-base pl-xl pr-xl text-on-surface placeholder:text-outline-variant focus:ring-0"
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-base top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-primary"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    <Icon
                      name={showPassword ? 'visibility_off' : 'visibility'}
                      className="text-[20px]"
                    />
                  </button>
                </div>
              </div>

              {error ? (
                <p className="rounded-lg border border-error/30 bg-error/10 px-base py-sm text-body-md text-error">
                  {error}
                </p>
              ) : null}

              {/* Primary Action */}
              <button
                type="submit"
                disabled={loading}
                className="primary-gradient primary-glow text-headline-md mt-base w-full rounded-lg py-base text-on-primary transition-all duration-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? '登录中…' : '进入工作台'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Mouse-following glow */}
      <div
        className="pointer-events-none fixed left-0 top-0 z-20 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[100px] transition-transform duration-150 ease-out"
        style={{
          opacity: cursorGlow.visible ? 1 : 0,
          transform: `translate(${cursorGlow.x}px, ${cursorGlow.y}px)`,
        }}
      />
    </div>
  );
}
