import { Injectable } from '@angular/core';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import Worker from 'worker-loader!../../workers/bgs-multi-sim.worker';
import { Preferences } from '../../models/preferences';
import { CardsFacadeService } from '../cards-facade.service';
import { OverwolfService } from '../overwolf.service';
import { chunk } from '../utils';
import { BgsBattleSimulationService } from './bgs-battle-simulation.service';

@Injectable()
export class BgsBattlePositioningService {
	private cpuCount: number;

	constructor(
		private readonly ow: OverwolfService,
		private readonly simulationService: BgsBattleSimulationService,
		private readonly allCards: CardsFacadeService,
	) {
		this.init();
	}

	private async init() {
		const systemInfo = await this.ow.getSystemInformation();
		this.cpuCount = (systemInfo?.PhysicalCPUCount ?? 1) - 1 || 1;
		console.log('CPU count', this.cpuCount);
	}

	public async findBestPositioning(battleInfo: BgsBattleInfo, prefs: Preferences): Promise<PermutationResult> {
		const start = Date.now();
		// Initialize the data
		const initialBoard = battleInfo.playerBoard.board;

		// Build permutations of the main board
		const permutations: Permutation[] = permutator(initialBoard);
		console.debug('permutations', Date.now() - start, permutations);

		// Build a rough estimation of the permutations
		const sortedPermutations: InternalPermutationResult[] = await this.prunePermutations(
			battleInfo,
			permutations,
			80,
			100,
			50,
		);
		console.debug('first step', Date.now() - start, sortedPermutations.length, sortedPermutations);
		// Do it again, with more sims
		const sortedPermutations2: InternalPermutationResult[] = await this.prunePermutations(
			battleInfo,
			sortedPermutations.map((p) => p.permutation),
			250,
			400,
			50,
		);
		console.debug('second step', Date.now() - start, sortedPermutations2.length, sortedPermutations2);

		// Build a full simulation for each of the finalists and keep the best one
		const topPermutationsResults: InternalPermutationResult[] = await this.prunePermutations(
			battleInfo,
			sortedPermutations2.map((p) => p.permutation),
			2500,
			4000,
			1,
		);
		console.debug('topPermutationsResults', Date.now() - start, topPermutationsResults);

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
		return result;
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
			const worker = new Worker();
			worker.onmessage = (ev: MessageEvent) => {
				worker.terminate();
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

type Permutation = BoardEntity[];
type Chunk = Permutation[];

interface PermutationResult {
	readonly battleInfo: BgsBattleInfo;
	readonly result: SimulationResult;
}

export interface InternalPermutationResult {
	readonly permutation: Permutation;
	readonly result: SimulationResult;
}
