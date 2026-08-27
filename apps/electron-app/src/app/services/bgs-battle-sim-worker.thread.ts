import { parentPort, workerData } from 'worker_threads';
import { AllCardsService } from '@firestone-hs/reference-data';
import { simulateBattle } from '@firestone-hs/simulate-bgs-battle';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { CardsData } from '@firestone-hs/simulate-bgs-battle/dist/cards/cards-data';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';

if (!parentPort) {
	throw new Error('This file must be run as a worker thread');
}

// This worker is pooled and reused across battles, so the large card database is deserialized once
// (it arrives with the first job) and cached. Rebuilding it on every combat was a big part of each
// simulation's wall-clock cost back when the worker was spawned fresh each time.
let cards: AllCardsService | null = null;

// Shared with the main thread: the id of the run the pool currently cares about. During one combat
// the board is revealed in stages, each starting a new run; the opponent's later board is the
// accurate one, so an in-flight sim on a superseded board is wasted. Rather than kill the worker to
// stop it (which would throw away the cached cards and force a reload), the worker checks this atomic
// between iterations and abandons a run whose id no longer matches -- staying alive and warm for the
// job already queued behind it.
const sharedRunId: Int32Array | null = workerData?.sharedRunId ? new Int32Array(workerData.sharedRunId) : null;

interface WorkerJob {
	runId: number;
	battleMessage: BgsBattleInfo;
	// Present only on the first job a given worker receives; cached thereafter.
	cards?: any;
}

parentPort.on('message', (data: WorkerJob) => {
	const runId = data.runId;
	if (data.cards) {
		cards = Object.assign(new AllCardsService(), data.cards);
	}
	const battleInfo: BgsBattleInfo = data.battleMessage;
	if (!cards) {
		parentPort?.postMessage({ runId, data: null, done: true });
		return;
	}

	// A superseded run is dropped silently: the main thread has already moved on to a newer run id.
	const superseded = () => sharedRunId != null && Atomics.load(sharedRunId, 0) !== runId;

	// CardsData is rebuilt per battle: it is far cheaper than the card database, and a fresh instance
	// avoids any tribe state leaking between battles.
	const cardsData = new CardsData(cards, false);
	cardsData.inititialize(battleInfo.options.validTribes);

	try {
		const battleIterator = simulateBattle(battleInfo, cards, cardsData);
		let result = battleIterator.next();
		while (!result.done) {
			if (superseded()) {
				return;
			}
			// Intermediate partial-odds update.
			parentPort?.postMessage({ runId, data: JSON.stringify(result.value), done: false });
			result = battleIterator.next();
		}
		if (superseded()) {
			return;
		}
		// Final result. `done` marks completion explicitly so the pool can settle a worker even when
		// it was told not to record outcome samples (only one worker in the pool does).
		parentPort?.postMessage({ runId, data: JSON.stringify(result.value), done: true });
	} catch (e) {
		console.warn('no-format', 'battleInfo', JSON.stringify(battleInfo));
		console.error('Exception while simulating battle', e);
		parentPort?.postMessage({ runId, data: null, done: true });
	}
});
