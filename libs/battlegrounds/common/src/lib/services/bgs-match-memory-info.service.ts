/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { GameStateFacadeService } from '@firestone/game-state';
import { BattlegroundsInfo, MemoryInspectionService } from '@firestone/memory';
import { GameStatusService, PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Subscription, interval } from 'rxjs';
import { BgsMatchPlayersMmrService } from './bgs-match-players-mmr.service';

const INTERVAL = 3000;

@Injectable()
export class BgsMatchMemoryInfoService {
	public battlegroundsMemoryInfo$$ = new BehaviorSubject<BattlegroundsInfo | null>(null);

	private sub: Subscription;

	constructor(
		private readonly memory: MemoryInspectionService,
		private readonly gameState: GameStateFacadeService,
		private readonly gameStatus: GameStatusService,
		private readonly prefs: PreferencesService,
		private readonly matchPlayers: BgsMatchPlayersMmrService,
	) {
		this.init();
	}

	private async init() {
		this.startMemoryReading();
		this.gameStatus.onGameExit(() => {
			this.stopMemoryReading();
		});
	}

	private async startMemoryReading() {
		await waitForReady(this.gameState, this.prefs);

		this.sub = interval(INTERVAL).subscribe(async () => {
			const gameState = this.gameState.gameState$$.getValue();
			if (
				!gameState?.bgState?.currentGame ||
				!gameState.gameStarted ||
				gameState.gameEnded ||
				!isBattlegrounds(gameState.metadata.gameType)
			) {
				return;
			}

			const prefs = await this.prefs.getPreferences();
			const playersMmr =
				prefs.bgsShowMmrInLeaderboardOverlay || prefs.bgsShowMmrInOpponentRecap
					? await this.matchPlayers.playersMatchMmr$$.getValueWithInit()
					: null;
			const memoryInfo = await this.memory.getBattlegroundsMatchWithPlayers(1);
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
			this.battlegroundsMemoryInfo$$.next(result);
		});
	}

	private stopMemoryReading() {
		console.debug('[bgs-match-memory-info] stopping memory reading');
		this.sub?.unsubscribe();
	}
}
