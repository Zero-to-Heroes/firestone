/** Separate entry so Jest/barrel consumers do not load `import.meta` (Web Worker URL). */
export {
	ReplayParserWorkerService,
	type ReplayIndexWorkerResult,
} from './lib/workers/replay-parser-worker.service';
