/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { BnetRegion, GameType, isBattlegrounds, isBattlegroundsDuo } from '@firestone-hs/reference-data';
import { GameStateFacadeService, PlayerMatchMmr } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { auditTime, combineLatest, debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs';
import { BgsMatchMemoryInfoService } from './bgs-match-memory-info.service';
import { BattlegroundsOfficialLeaderboardService } from './bgs-official-leaderboards.service';

const MIN_RATING = 0; // 6000

@Injectable()
export class BgsMatchPlayersMmrService extends AbstractFacadeService<BgsMatchPlayersMmrService> {
	public playersMatchMmr$$: SubscriberAwareBehaviorSubject<readonly PlayerMatchMmr[] | null>;

	private memoryInfo: BgsMatchMemoryInfoService;
	private leaderboards: BattlegroundsOfficialLeaderboardService;
	private gameState: GameStateFacadeService;
	private prefs: PreferencesService;

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
		this.prefs = AppInjector.get(PreferencesService);

		await waitForReady(this.leaderboards, this.gameState);

		this.playersMatchMmr$$.onFirstSubscribe(async () => {
			const gameMode$ = this.gameState.gameState$$.pipe(
				auditTime(500),
				map((gameState) => gameState?.metadata.gameType),
				filter((gameType) => !!gameType && isBattlegrounds(gameType)),
				distinctUntilChanged(),
			);

			const leaderboards$ = gameMode$.pipe(
				switchMap((gameMode) =>
					this.leaderboards.loadLeaderboards(
						isBattlegroundsDuo(gameMode ?? GameType.GT_BATTLEGROUNDS)
							? 'battlegrounds-duo'
							: 'battlegrounds',
					),
				),
			);

			const gameInfo$ = combineLatest([
				this.memoryInfo.battlegroundsMemoryInfo$$,
				this.gameState.gameState$$,
				this.prefs.preferences$$.pipe(
					map((prefs) => prefs.bgsUseLeaderboardDataInOverlay || prefs.bgsShowMmrInOpponentRecap),
				),
			]).pipe(
				debounceTime(500),
				filter(([memoryInfo, gameState, useLeaderboardData]) => useLeaderboardData),
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
				distinctUntilChanged(
					(a, b) =>
						a?.region === b?.region &&
						a?.players.length === b?.players.length &&
						!!a?.players.every(
							(player, index) =>
								player.id === b?.players[index].id && player.name === b?.players[index].name,
						),
				),
			);

			combineLatest([gameInfo$, leaderboards$])
				.pipe(
					debounceTime(200),
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
								return {
									playerId: player.id,
									playerName: player.name,
									mmr: leaderboardPlayer?.rating ?? null,
								};
							}) ?? [];
						return players;
					}),
					distinctUntilChanged(
						(a, b) =>
							a?.length === b?.length &&
							!!a?.every(
								(player, index) =>
									b?.[index]?.playerId === player.playerId &&
									b?.[index]?.mmr === player.mmr &&
									b?.[index]?.playerName === player.playerName,
							),
					),
					// tap((players) => console.debug('[bgs-match-players-mmr] players', players)),
				)
				.subscribe((players) => {
					this.playersMatchMmr$$.next(players);
				});
		});
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
