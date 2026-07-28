/**
 * Isolated so tests can jest.mock it: `import.meta` (required verbatim for the
 * bundler's worker detection) doesn't compile under the CommonJS Jest transform.
 */
export const createSimWorker = (): Worker => new Worker(new URL('./bgs-battle-sim-worker.worker', import.meta.url));
