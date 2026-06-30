/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'aigc-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3011,
      },
    },
    {
      name: 'aigc-web',
      cwd: './apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
    },
  ],
};
