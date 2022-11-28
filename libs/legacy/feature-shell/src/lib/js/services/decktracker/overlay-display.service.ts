import { Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { GameState } from '../../models/decktracker/game-state';
import { Preferences } from '../../models/preferences';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

@Injectable()
export class OverlayDisplayService {
	private decktrackerDisplayEventBus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	constructor(private readonly store: AppUiStoreFacadeService) {
		window['decktrackerDisplayEventBus'] = this.decktrackerDisplayEventBus;
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		combineLatest(
			this.store.listenDeckState$((gameState) => gameState),
			this.store.listen$(([main, nav, prefs]) => prefs),
		)
			.pipe(
				debounceTime(200),
				map(([[gameState], [prefs]]) => ({ gameState: gameState, prefs: prefs })),
				map((info) => this.shouldDisplay(info.gameState, info.prefs)),
				distinctUntilChanged(),
			)
			.subscribe((shouldDisplay) => this.decktrackerDisplayEventBus.next(shouldDisplay));
	}

	private shouldDisplay(gameState: GameState, prefs: Preferences): boolean {
		if (!gameState || !gameState.metadata || !gameState.metadata.gameType || !gameState.playerDeck) {
			if (gameState?.metadata?.gameType) {
				console.warn(
					'[overlay-display] not enough info to display',
					gameState?.metadata,
					gameState?.playerDeck,
				);
			}
			return false;
		}
		switch (gameState.metadata.gameType as GameType) {
			case GameType.GT_ARENA:
				return prefs.decktrackerShowArena;
			case GameType.GT_CASUAL:
				return prefs.decktrackerShowCasual;
			case GameType.GT_RANKED:
				return prefs.decktrackerShowRanked;
			case GameType.GT_VS_AI:
				return prefs.decktrackerShowPractice;
			case GameType.GT_VS_FRIEND:
				return prefs.decktrackerShowFriendly;
			case GameType.GT_FSG_BRAWL:
			case GameType.GT_FSG_BRAWL_1P_VS_AI:
			case GameType.GT_FSG_BRAWL_2P_COOP:
			case GameType.GT_FSG_BRAWL_VS_FRIEND:
			case GameType.GT_TB_1P_VS_AI:
			case GameType.GT_TB_2P_COOP:
			case GameType.GT_TAVERNBRAWL:
				return prefs.decktrackerShowTavernBrawl;
			case GameType.GT_BATTLEGROUNDS:
			case GameType.GT_BATTLEGROUNDS_FRIENDLY:
			case GameType.GT_BATTLEGROUNDS_AI_VS_AI:
			case GameType.GT_BATTLEGROUNDS_PLAYER_VS_AI:
				return false;
			case GameType.GT_PVPDR:
			case GameType.GT_PVPDR_PAID:
				return prefs.decktrackerShowDuels;
			case GameType.GT_MERCENARIES_AI_VS_AI:
			case GameType.GT_MERCENARIES_FRIENDLY:
			case GameType.GT_MERCENARIES_PVP:
			case GameType.GT_MERCENARIES_PVE:
			case GameType.GT_MERCENARIES_PVE_COOP:
				return false;
		}
		console.warn('[overlay-display] unknown game type', gameState.metadata.gameType as GameType);
		return gameState.playerDeck.deckList.length > 0;
	}
}
