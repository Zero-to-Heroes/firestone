/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/constructed/common';
import { SubscriberAwareBehaviorSubject, deepEqual } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs';
import { PlayerMatchMmr } from '../model/in-game/bgs-player-match-mmr';
import { BgsMatchMemoryInfoService } from './bgs-match-memory-info.service';
import { BattlegroundsOfficialLeaderboardService } from './bgs-official-leaderboards.service';

const MIN_RATING = 0; // 6000

@Injectable()
export class BgsMatchPlayersMmrService extends AbstractFacadeService<BgsMatchPlayersMmrService> {
	public playersMatchMmr$$ = new SubscriberAwareBehaviorSubject<readonly PlayerMatchMmr[] | null>(null);

	private memoryInfo: BgsMatchMemoryInfoService;
	private leaderboards: BattlegroundsOfficialLeaderboardService;
	private gameState: GameStateFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsMatchPlayersMmrService', () => !!this.playersMatchMmr$$);
	}

	protected override assignSubjects() {
		this.playersMatchMmr$$ = this.mainInstance.playersMatchMmr$$;
	}

	protected async init() {
		this.playersMatchMmr$$ = new SubscriberAwareBehaviorSubject<readonly PlayerMatchMmr[] | null>(null);
		this.memoryInfo = AppInjector.get(BgsMatchMemoryInfoService);
		this.leaderboards = AppInjector.get(BattlegroundsOfficialLeaderboardService);
		this.gameState = AppInjector.get(GameStateFacadeService);

		await this.leaderboards.isReady();
		await this.gameState.isReady();

		this.playersMatchMmr$$.onFirstSubscribe(async () => {
			const gameInfo$ = combineLatest([
				this.memoryInfo.battlegroundsMemoryInfo$$,
				this.gameState.gameState$$,
			]).pipe(
				debounceTime(2000),
				tap((info) => console.debug('[bgs-match-players-mmr] before game info', info)),
				map(([memoryInfo, gameState]) => {
					if (!memoryInfo?.Game?.Players?.length || !gameState?.region) {
						return null;
					}
					if (!memoryInfo.Rating || memoryInfo.Rating < MIN_RATING) {
						return null;
					}

					return {
						region: toRegion(gameState?.region),
						players: memoryInfo.Game.Players.map((player) => ({
							id: player.Id,
							name: player.Name || null,
						})),
					};
				}),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
				tap((info) => console.debug('[bgs-match-players-mmr] game info', info)),
			);

			combineLatest([gameInfo$, this.leaderboards.leaderboards$$])
				.pipe(
					debounceTime(2000),
					filter(([gameInfo, leaderboards]) => !!gameInfo && !!leaderboards?.leaderboards?.length),
					map(([gameInfo, leaderboards]) => {
						const leaderboard = leaderboards!.leaderboards.find(
							(leaderboard) => leaderboard.region === gameInfo!.region,
						);

						const players: readonly PlayerMatchMmr[] =
							gameInfo?.players.map((player) => {
								// In case there are multiple matches, it takes the best ranked one
								const leaderboardPlayer = leaderboard?.entries.find(
									(leaderboardPlayer) => leaderboardPlayer.accountId === player.name,
								);
								console.debug('[bgs-match-players-mmr] player', player, leaderboardPlayer);
								return {
									playerId: player.id,
									playerName: player.name,
									mmr: leaderboardPlayer?.rating ?? null,
								};
							}) ?? [];
						return players;
					}),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
					tap((players) => console.debug('[bgs-match-players-mmr] players', players)),
				)
				.subscribe((players) => {
					this.playersMatchMmr$$.next(players);
				});
		});
		this.playersMatchMmr$$.subscribe();
	}
}

const toRegion = (region: BnetRegion | null | undefined): 'EU' | 'US' | 'AP' => {
	switch (region) {
		case BnetRegion.REGION_US:
			return 'US';
		case BnetRegion.REGION_EU:
			return 'EU';
		case BnetRegion.REGION_KR:
		case BnetRegion.REGION_CN:
		case BnetRegion.REGION_TW:
			return 'AP';
		default:
			return 'US';
	}
};
