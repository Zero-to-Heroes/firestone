/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { BattlegroundsInfo, MemoryInspectionService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { deepEqual } from '@firestone/shared/framework/common';
import {
	BehaviorSubject,
	Subscription,
	distinctUntilChanged,
	from,
	interval,
	map,
	switchMap,
	tap,
	withLatestFrom,
} from 'rxjs';
import { BgsStateFacadeService } from './bgs-state-facade.service';

const INTERVAL = 3000;

@Injectable()
export class BgsMatchMemoryInfoService {
	public battlegroundsMemoryInfo$$ = new BehaviorSubject<BattlegroundsInfo | null>(null);

	private sub: Subscription;

	constructor(
		private readonly memory: MemoryInspectionService,
		private readonly gameState: BgsStateFacadeService,
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
		await this.gameState.isReady();

		this.sub = interval(INTERVAL)
			.pipe(
				withLatestFrom(this.gameState.gameState$$),
				map(([, gameState]) => {
					const result = {
						players: gameState?.currentGame?.players?.length,
						currentPhase: gameState?.currentGame?.phase,
					};
					return result;
				}),
				// Allow the data to be fetched even when there are not 8 players yet,
				// as we are interested in having the tribe info
				// filter((info) => info.players === 8),
				switchMap((gameInfo) =>
					from(this.memory.getBattlegroundsMatchWithPlayers(1)).pipe(
						map((memoryInfo) => ({ gameInfo, memoryInfo })),
					),
				),
				// filter(({ gameInfo, memoryInfo }) => memoryInfo?.Game?.Players?.length === 8),
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
				distinctUntilChanged((a, b) => deepEqual(a, b)),
				tap((info) => console.debug('[bgs-match-memory-info] will emit new memory info', info)),
			)
			.subscribe((info) => this.battlegroundsMemoryInfo$$.next(info as BattlegroundsInfo));
	}

	public stopMemoryReading() {
		console.debug('[bgs-match-memory-info] stopping memory reading');
		this.sub?.unsubscribe();
	}
}
