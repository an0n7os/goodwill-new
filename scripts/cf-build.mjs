import { spawnSync } from 'node:child_process';

const isInner = process.env.OPENNEXT_INNER_BUILD === '1';
const isCloudflareCI = Boolean(process.env.WORKERS_CI || process.env.CF_PAGES || process.env.CI);

function run(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
  });
  process.exit(result.status ?? 1);
}

if (isInner || !isCloudflareCI) {
  run('npx', ['next', 'build', '--webpack']);
} else {
  run('npx', ['opennextjs-cloudflare', 'build'], { OPENNEXT_INNER_BUILD: '1' });
}
