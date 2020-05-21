import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameState } from '../../models/decktracker/game-state';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { DeckEvents } from './event-parser/deck-events';

@Injectable()
export class OverlayDisplayService implements OnDestroy {
	private decktrackerDisplayEventBus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	private gameState: GameState;

	private preferencesSubscription: Subscription;
	private deckSubscription: Subscription;

	constructor(private prefs: PreferencesService, private ow: OverwolfService) {
		this.init();
		window['decktrackerDisplayEventBus'] = this.decktrackerDisplayEventBus;
	}

	ngOnDestroy(): void {
		this.preferencesSubscription.unsubscribe();
		this.deckSubscription.unsubscribe();
	}

	private init() {
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe(event => {
			if (event.name === PreferencesService.DECKTRACKER_OVERLAY_DISPLAY) {
				this.handleDisplayPreferences(this.gameState, event.preferences);
			}
		});
		const deckEventBus: EventEmitter<any> = this.ow.getMainWindow().deckEventBus;
		this.deckSubscription = deckEventBus.subscribe(async event => {
			// console.log('[overlay-display] received deck event', event);
			if (event) {
				this.gameState = event.state;
				await this.processEvent(event.event);
			}
		});
	}

	private async processEvent(event) {
		switch (event.name) {
			case DeckEvents.MATCH_METADATA:
				// console.log('[overlay-display] received MATCH_METADATA event');
				this.handleDisplayPreferences(this.gameState);
				break;
			case DeckEvents.GAME_END:
				// console.log('[overlay-display] received GAME_END event, sending false');
				this.decktrackerDisplayEventBus.next(false);
				break;
		}
	}

	private async handleDisplayPreferences(gameState: GameState, preferences: Preferences = null): Promise<void> {
		const prefs = preferences || (await this.prefs.getPreferences());
		const shouldDisplay = this.shouldDisplay(gameState, prefs);
		// console.log('[overlay-display] should display?', shouldDisplay, prefs, gameState);
		this.decktrackerDisplayEventBus.next(shouldDisplay);
	}

	private shouldDisplay(gameState: GameState, prefs: Preferences): boolean {
		if (!gameState || !gameState.metadata || !gameState.metadata.gameType || !gameState.playerDeck) {
			console.log('[overlay-display] not enough info to display');
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
				return false;
		}
		console.log('[overlay-display] unknown game type', gameState.metadata.gameType as GameType);
		return gameState.playerDeck.deckList.length > 0;
	}
}
