import { ApiStatus } from '@/components/api-status';

export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <main className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
          AIGC Platform
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          项目初始化完成
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Monorepo 已就绪，包含 Next.js 前端与 NestJS 后端，可通过 Docker
          一键启动开发环境。
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            'Next.js + Tailwind + Zustand',
            'NestJS + Prisma + MySQL',
            'pnpm workspace',
            'Docker Compose',
          ].map((item) => (
            <div
              key={item}
              className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <ApiStatus />
        </div>
      </main>
    </div>
  );
}
