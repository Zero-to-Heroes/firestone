import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import {
	BgsBattlePositioningExecutorService,
	PermutationResult,
	ProcessingStatus,
} from '../../../../../libs/legacy/feature-shell/src/lib/js/services/battlegrounds/bgs-battle-positioning-executor.service';
import { CardsFacadeService } from '../../../../../libs/legacy/feature-shell/src/lib/js/services/cards-facade.service';
import { OverwolfService } from '../../../../../libs/legacy/feature-shell/src/lib/js/services/overwolf.service';
import { chunk } from '../../../../../libs/legacy/feature-shell/src/lib/js/services/utils';
import { Chunk, InternalPermutationResult, Permutation } from './bgs-battle-positioning-worker.worker';

@Injectable()
export class BgsBattlePositioningWorkerService extends BgsBattlePositioningExecutorService {
	private cpuCount: number;
	private cancelled: boolean;
	private workers: Worker[] = [];

	constructor(private readonly allCards: CardsFacadeService, private readonly ow: OverwolfService) {
		super();
		this.init();
	}

	private async init() {
		const systemInfo = await this.ow.getSystemInformation();
		this.cpuCount = (systemInfo?.PhysicalCPUCount ?? 1) - 1 || 1;
		console.log('CPU count', this.cpuCount);
	}

	public cancel() {
		console.debug('cancelling?', this.cancelled);
		if (this.cancelled) {
			return;
		}

		console.log('cancelling process');
		this.cancelled = true;
		for (let i = this.workers.length - 1; i >= 0; i--) {
			this.workers[i].terminate();
		}
		this.workers = [];
		this.cancelled = false;
		console.log('cancelled process');
	}

	public findBestPositioning(battleInfo: BgsBattleInfo): AsyncIterator<[ProcessingStatus, PermutationResult]> {
		const iterator: AsyncIterator<[ProcessingStatus, PermutationResult]> =
			this.findBestPositioningInternal(battleInfo);
		return iterator;
	}

	private async *findBestPositioningInternal(
		battleInfo: BgsBattleInfo,
	): AsyncIterator<[ProcessingStatus, PermutationResult]> {
		this.cancelled = false;
		const start = Date.now();
		// Initialize the data
		const initialBoard = battleInfo.playerBoard.board;

		// Build permutations of the main board
		const permutations: Permutation[] = permutator(initialBoard);
		console.debug('permutations', Date.now() - start, permutations);
		if (this.cancelled) {
			return [ProcessingStatus.CANCELLED, null];
		}

		yield [ProcessingStatus.FIRSTPASS, null];
		// Build a rough estimation of the permutations
		const sortedPermutations: InternalPermutationResult[] = await this.prunePermutations(
			battleInfo,
			permutations,
			80,
			100,
			50,
		);
		console.debug('first step', Date.now() - start, sortedPermutations.length, sortedPermutations);
		if (this.cancelled) {
			return [ProcessingStatus.CANCELLED, null];
		}

		yield [ProcessingStatus.SECONDPASS, null];
		// Do it again, with more sims
		const sortedPermutations2: InternalPermutationResult[] = await this.prunePermutations(
			battleInfo,
			sortedPermutations.map((p) => p.permutation),
			250,
			400,
			50,
		);
		console.debug('second step', Date.now() - start, sortedPermutations2.length, sortedPermutations2);
		if (this.cancelled) {
			return [ProcessingStatus.CANCELLED, null];
		}

		// Build a full simulation for each of the finalists and keep the best one
		yield [ProcessingStatus.FINALRESULT, null];
		const topPermutationsResults: InternalPermutationResult[] = await this.prunePermutations(
			battleInfo,
			sortedPermutations2.map((p) => p.permutation),
			2500,
			4000,
			1,
		);
		console.debug('topPermutationsResults', Date.now() - start, topPermutationsResults);
		if (this.cancelled) {
			return [ProcessingStatus.CANCELLED, null];
		}

		const result = {
			battleInfo: {
				...battleInfo,
				playerBoard: {
					...battleInfo.playerBoard,
					board: topPermutationsResults[0].permutation,
				},
			},
			result: topPermutationsResults[0].result,
		};
		console.debug('result', Date.now() - start, result);
		return [ProcessingStatus.DONE, result];
	}

	private async prunePermutations(
		battleInfo: BgsBattleInfo,
		permutations: Permutation[],
		numberOfSims: number,
		maxDuration: number,
		minResultsToKeep: number,
	): Promise<InternalPermutationResult[]> {
		// Split it in chunks to use multiple CPUs in parallel
		const chunkSize = Math.ceil(permutations.length / this.cpuCount);
		console.debug('chunkSize', chunkSize);
		const chunks: Chunk[] = chunk(permutations, chunkSize);

		// Work on each permutation in its own worker
		const chunkResults: InternalPermutationResult[][] = await Promise.all(
			chunks.map((chunk) => this.buildRoughResults(battleInfo, chunk, numberOfSims, maxDuration)),
		);
		// console.debug('chunk results', chunkResults);
		const permutationResults: InternalPermutationResult[] = chunkResults.reduce((a, b) => a.concat(b), []);
		// console.debug('permutationResults', permutationResults);

		// Sort the permutations by winrate
		const sortedPermutations = [...permutationResults].sort((a, b) => {
			return (
				b.result.wonPercent - a.result.wonPercent ||
				a.result.lostPercent - b.result.lostPercent ||
				b.result.wonLethalPercent - a.result.wonLethalPercent ||
				a.result.lostLethalPercent - b.result.lostLethalPercent
			);
		});
		// console.debug('sortedPermutations', sortedPermutations);

		// Now decide which ones to keep
		const result = sortedPermutations.splice(0, minResultsToKeep);
		// Keep the ones that are at least as good
		for (const permutation of sortedPermutations) {
			if (permutation.result.wonPercent >= result[0].result.wonPercent) {
				// When it's a case where you can't win, try to tie
				if (
					permutation.result.wonPercent !== 0 ||
					permutation.result.tiedPercent >= result[0].result.tiedPercent
				) {
					result.push(permutation);
				}
			} else {
				break;
			}
		}

		return result;
	}

	private async buildRoughResults(
		battleInfo: BgsBattleInfo,
		chunk: Chunk,
		numberOfSims: number,
		maxDuration: number,
	): Promise<InternalPermutationResult[]> {
		return new Promise<InternalPermutationResult[]>((resolve) => {
			const worker = new Worker(new URL('./bgs-battle-positioning-worker.worker', import.meta.url));
			this.workers.push(worker);
			worker.onmessage = (ev: MessageEvent) => {
				worker.terminate();
				this.workers.splice(this.workers.indexOf(worker), 1);
				resolve(JSON.parse(ev.data));
			};
			const battleMessages = chunk.map(
				(permutation) =>
					({
						...battleInfo,
						playerBoard: {
							...battleInfo.playerBoard,
							board: permutation,
						},
						options: {
							...battleInfo.options,
							numberOfSimulations: numberOfSims,
							maxAcceptableDuration: maxDuration,
							skipInfoLogs: true,
						},
					} as BgsBattleInfo),
			);
			worker.postMessage({
				battleMessages: battleMessages,
				cards: this.allCards.getService(),
			});
		});
	}
}

const permutator = <T>(inputArr: readonly T[]) => {
	const result: T[][] = [];

	const permute = (arr, m: T[] = []) => {
		if (arr.length === 0) {
			result.push(m);
		} else {
			for (let i = 0; i < arr.length; i++) {
				const curr = arr.slice();
				const next = curr.splice(i, 1);
				permute(curr.slice(), m.concat(next));
			}
		}
	};

	permute(inputArr);
	return result;
};
