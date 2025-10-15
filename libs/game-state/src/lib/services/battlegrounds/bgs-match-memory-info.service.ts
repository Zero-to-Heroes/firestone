/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { BattlegroundsInfo, MemoryInspectionService } from '@firestone/memory';
import { GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { AppInjector, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, interval } from 'rxjs';
import { GameStateFacadeService } from '../game-state-facade.service';
import { BgsMatchPlayersMmrService } from './bgs-match-players-mmr.service';

const INTERVAL = 3000;

@Injectable({ providedIn: 'root' })
export class BgsMatchMemoryInfoService {
	public battlegroundsMemoryInfo$$ = new BehaviorSubject<BattlegroundsInfo | null>(null);

	constructor(
		private readonly memory: MemoryInspectionService,
		private readonly gameStatus: GameStatusService,
		private readonly prefs: PreferencesService,
		private readonly matchPlayers: BgsMatchPlayersMmrService,
	) {
		this.init();
	}

	private async init() {
		this.startMemoryReading();
	}

	private async startMemoryReading() {
		console.log('[bgs-match-memory-info] getting ready to start memory reading');
		await waitForReady(this.prefs, this.gameStatus);
		console.log('[bgs-match-memory-info] starting memory reading');

		const gameStateService = AppInjector.get(GameStateFacadeService);
		await waitForReady(gameStateService);

		let inProcess = false;
		interval(INTERVAL).subscribe(async () => {
			try {
				if (!this.gameStatus.inGame$$.value) {
					// console.debug('[bgs-match-memory-info] not in game, not reading memory');
					return;
				}
				if (inProcess) {
					// console.debug('[bgs-match-memory-info] already in process, skipping this reading');
					return;
				}

				const gameState = gameStateService.gameState$$.getValue();
				if (
					!gameState?.bgState?.currentGame ||
					!gameState.gameStarted ||
					gameState.gameEnded ||
					!isBattlegrounds(gameState.metadata?.gameType)
				) {
					// console.debug(
					// 	'[bgs-match-memory-info] no BG game in progress, not doing memory reading',
					// 	!!gameState?.bgState?.currentGame,
					// 	gameState?.gameStarted,
					// 	gameState?.gameEnded,
					// 	gameState?.metadata?.gameType,
					// 	isBattlegrounds(gameState?.metadata?.gameType),
					// );
					return;
				}

				inProcess = true;
				// console.debug('[bgs-match-memory-info] reading memory info');
				const memoryInfo = await this.memory.getBattlegroundsMatchWithPlayers(1);
				if (!memoryInfo) {
					console.debug('[bgs-match-memory-info] no memory info found, skipping this reading');
					inProcess = false;
					return;
				}

				// So that we send it right away to get the most important info
				this.battlegroundsMemoryInfo$$.next(memoryInfo);
				// console.debug('[bgs-match-memory-info] sent memory info basic info', memoryInfo?.Game?.AvailableRaces);

				const prefs = await this.prefs.getPreferences();
				if (!prefs.bgsShowMmrInLeaderboardOverlay && !prefs.bgsShowMmrInOpponentRecap) {
					inProcess = false;
					return;
				}

				// console.debug('[bgs-match-memory-info] reading player MMR info');
				const playersMmr = await this.matchPlayers.playersMatchMmr$$.getValueWithInit();
				const result: BattlegroundsInfo = {
					...memoryInfo,
					Game: {
						...memoryInfo!.Game,
						Players: memoryInfo!.Game.Players.map((player) => {
							const playerMmr = playersMmr?.find((mmr) => mmr.playerId === player.Id);
							const playerResult = {
								...player,
								// We set the damage to null because? Most likely this is to avoid info
								// leaks
								Damage: gameState.bgState.currentGame?.phase === 'recruit' ? player.Damage : null,
								Mmr: playerMmr?.mmr,
							};
							return playerResult;
						}),
					},
				} as BattlegroundsInfo;
				// console.debug('[bgs-match-memory-info] memory info read', result?.Game?.AvailableRaces);
				this.battlegroundsMemoryInfo$$.next(result);
				inProcess = false;
			} catch (e) {
				console.error('[bgs-match-memory-info] error while reading memory info', e);
				inProcess = false;
			}
		});
	}
}
