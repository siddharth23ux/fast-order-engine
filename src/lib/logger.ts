// src/lib/logger.ts
// Silent logger during tests to avoid "Cannot log after tests are done"
// For local/dev, it prints normally.
export const log = (...args: any[]) => {
  // Jest sets JEST_WORKER_ID in env for worker processes
  if (process.env.JEST_WORKER_ID) return;
  console.log('[LOG]', ...args);
};
