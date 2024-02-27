/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { BattlegroundsInfo, MemoryInspectionService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import {
	BehaviorSubject,
	Subscription,
	distinctUntilChanged,
	filter,
	from,
	interval,
	map,
	switchMap,
	tap,
	withLatestFrom,
} from 'rxjs';
import { BgsGameStateFacadeService } from './bgs-game-state-facade.service';

const INTERVAL = 3000;

@Injectable()
export class BgsMatchMemoryInfoService {
	public battlegroundsMemoryInfo$$ = new BehaviorSubject<BattlegroundsInfo | null>(null);

	private sub: Subscription;

	constructor(
		private readonly memory: MemoryInspectionService,
		private readonly gameState: BgsGameStateFacadeService,
		private readonly gameStatus: GameStatusService,
	) {
		this.init();
	}

	private async init() {
		this.gameStatus.onGameExit(() => {
			this.stopMemoryReading();
		});
	}

	public async startMemoryReading() {
		// console.debug('[bgs-match-memory-info] starting memory reading');
		await this.gameState.isReady();
		// console.debug('[bgs-match-memory-info] ready');

		this.sub = interval(INTERVAL)
			.pipe(
				// tap((_) => console.debug('[bgs-match-memory-info] interval')),
				withLatestFrom(this.gameState.gameState$$),
				map(([, gameState]) => {
					const result = {
						players: gameState?.currentGame?.players?.length,
						currentPhase: gameState?.currentGame?.phase,
					};
					// console.debug('[bgs-match-memory-info] current game state', result);
					return result;
				}),
				filter((info) => info.players === 8),
				switchMap((gameInfo) =>
					from(this.memory.getBattlegroundsMatchWithPlayers(1)).pipe(
						map((memoryInfo) => ({ gameInfo, memoryInfo })),
					),
				),
				// tap(({ gameInfo, memoryInfo }) =>
				// 	console.debug('[bgs-match-memory-info] received new memory info', gameInfo, memoryInfo),
				// ),
				filter(({ gameInfo, memoryInfo }) => memoryInfo?.Game?.Players?.length === 8),
				map(
					({ gameInfo, memoryInfo }) =>
						({
							...memoryInfo,
							Game: {
								...memoryInfo!.Game,
								Players: memoryInfo!.Game.Players.map((player) => ({
									...player,
									// We set the damage to null because? Most likely this is to avoid info
									// leaks
									Damage: gameInfo?.currentPhase === 'recruit' ? player.Damage : null,
								})),
							},
						} as BattlegroundsInfo),
				),
				// tap((info) => console.debug('[bgs-match-memory-info] bult updated memory info', info)),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
				// takeUntil(this.stopped$$),
				tap((info) => console.debug('[bgs-match-memory-info] will emit new memory info', info)),
			)
			.subscribe((info) => this.battlegroundsMemoryInfo$$.next(info as BattlegroundsInfo));
		// console.debug('[bgs-match-memory-info] subscribed');
	}

	public stopMemoryReading() {
		console.debug('[bgs-match-memory-info] stopping memory reading');
		this.sub?.unsubscribe();
	}
}
