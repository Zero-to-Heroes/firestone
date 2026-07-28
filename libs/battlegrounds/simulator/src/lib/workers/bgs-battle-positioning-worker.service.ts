import { Inject, Injectable, NgZone } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { chunk } from '@firestone/shared/framework/common';
import {
	BgsBattlePositioningExecutorService,
	PermutationResult,
	ProcessingStatus,
} from '../services/bgs-battle-positioning-executor.service';
import { CardsFacadeService, ISystemInfoService, SYSTEM_INFO_SERVICE_TOKEN } from '@firestone/shared/framework/core';
import { Chunk, InternalPermutationResult, Permutation } from './bgs-battle-positioning-worker.worker';

@Injectable()
export class BgsBattlePositioningWorkerService extends BgsBattlePositioningExecutorService {
	private cpuCount: number;
	private cancelled: boolean;
	private workers: Worker[] = [];
	private maxWorkers = 12;
	private maxSimulationsPerChunk = 100;

	constructor(
		private readonly allCards: CardsFacadeService,
		@Inject(SYSTEM_INFO_SERVICE_TOKEN) private readonly systemInfoService: ISystemInfoService,
		private readonly ngZone: NgZone,
	) {
		super();
		this.init();
	}

	private async init() {
		const systemInfo = await this.systemInfoService.getSystemInformation();
		this.cpuCount = (systemInfo?.PhysicalCPUCount ?? 1) - 1 || 1;
		console.log('CPU count', this.cpuCount);
	}

	public cancel() {
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

	public findBestPositioning(battleInfo: BgsBattleInfo): AsyncIterator<[ProcessingStatus, PermutationResult | null]> {
		const iterator: AsyncIterator<[ProcessingStatus, PermutationResult | null]> =
			this.findBestPositioningInternal(battleInfo);
		return iterator;
	}

	private async *findBestPositioningInternal(
		battleInfo: BgsBattleInfo,
	): AsyncIterator<[ProcessingStatus, PermutationResult | null]> {
		const start = Date.now();
		this.cancelled = false;
		const initialBoard = battleInfo.playerBoard.board;

		const permutations: Permutation[] = permutator(initialBoard);
		if (this.cancelled) {
			return [ProcessingStatus.CANCELLED, null];
		}

		yield [ProcessingStatus.FIRSTPASS, null];
		const sortedPermutations: InternalPermutationResult[] = await this.prunePermutations(
			battleInfo,
			permutations,
			80,
			100,
			50,
		);
		if (this.cancelled) {
			return [ProcessingStatus.CANCELLED, null];
		}

		yield [ProcessingStatus.SECONDPASS, null];
		const sortedPermutations2: InternalPermutationResult[] = await this.prunePermutations(
			battleInfo,
			sortedPermutations.map((p) => p.permutation),
			250,
			400,
			50,
		);
		if (this.cancelled) {
			return [ProcessingStatus.CANCELLED, null];
		}

		yield [ProcessingStatus.FINALRESULT, null];
		const topPermutationsResults: InternalPermutationResult[] = await this.prunePermutations(
			battleInfo,
			sortedPermutations2.map((p) => p.permutation),
			2500,
			4000,
			1,
		);
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
		const end = Date.now();
		console.debug('[bgs-battle-positioning-worker] time taken', end - start);
		return [ProcessingStatus.DONE, result];
	}

	private async prunePermutations(
		battleInfo: BgsBattleInfo,
		permutations: Permutation[],
		numberOfSims: number,
		maxDuration: number,
		minResultsToKeep: number,
	): Promise<InternalPermutationResult[]> {
		const chunks: Chunk[] = chunk(permutations, this.maxSimulationsPerChunk);

		const maxConcurrentWorkers = Math.min(this.cpuCount, this.maxWorkers);
		const chunkResults: InternalPermutationResult[][] = await this.processChunksInBatches(
			battleInfo,
			chunks,
			numberOfSims,
			maxDuration,
			maxConcurrentWorkers,
		);
		const permutationResults: InternalPermutationResult[] = chunkResults.reduce((a, b) => a.concat(b), []);

		const sortedPermutations = [...permutationResults].sort((a, b) => {
			return (
				b.result.wonPercent - a.result.wonPercent ||
				a.result.lostPercent - b.result.lostPercent ||
				b.result.wonLethalPercent - a.result.wonLethalPercent ||
				a.result.lostLethalPercent - b.result.lostLethalPercent
			);
		});

		const result = sortedPermutations.splice(0, minResultsToKeep);
		for (const permutation of sortedPermutations) {
			if (permutation.result.wonPercent >= result[0].result.wonPercent) {
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

	private async processChunksInBatches(
		battleInfo: BgsBattleInfo,
		chunks: Chunk[],
		numberOfSims: number,
		maxDuration: number,
		maxConcurrentWorkers: number,
	): Promise<InternalPermutationResult[][]> {
		const results: InternalPermutationResult[][] = [];

		for (let i = 0; i < chunks.length; i += maxConcurrentWorkers) {
			if (this.cancelled) {
				break;
			}

			const batch = chunks.slice(i, i + maxConcurrentWorkers);
			const batchResults = await Promise.all(
				batch.map((boardChunk) => this.buildRoughResults(battleInfo, boardChunk, numberOfSims, maxDuration)),
			);
			results.push(...batchResults);
		}

		return results;
	}

	private async buildRoughResults(
		battleInfo: BgsBattleInfo,
		boardChunk: Chunk,
		numberOfSims: number,
		maxDuration: number,
	): Promise<InternalPermutationResult[]> {
		return new Promise<InternalPermutationResult[]>((resolve) => {
			this.ngZone.runOutsideAngular(() => {
				const worker = new Worker(new URL('./bgs-battle-positioning-worker.worker', import.meta.url));
				this.workers.push(worker);

				worker.onmessage = (ev: MessageEvent) => {
					worker.terminate();
					this.workers.splice(this.workers.indexOf(worker), 1);
					const results = JSON.parse(ev.data);
					resolve(results);
				};

				worker.onerror = (error) => {
					console.error('[bgs-positioning] Worker error:', error);
					worker.terminate();
					this.workers.splice(this.workers.indexOf(worker), 1);
					resolve([]);
				};

				const battleMessages = boardChunk.map(
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
								hideMaxSimulationDurationWarning: true,
								skipInfoLogs: true,
								includeOutcomeSamples: false,
							},
						}) as BgsBattleInfo,
				);

				worker.postMessage({
					battleMessages: battleMessages,
					cards: this.allCards.getService(),
				});
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
