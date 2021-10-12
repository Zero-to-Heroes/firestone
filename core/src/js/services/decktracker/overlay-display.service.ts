import { EventEmitter, HostListener, Injectable, OnDestroy } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { GameState } from '../../models/decktracker/game-state';
import { GameEvent } from '../../models/game-event';
import { Preferences } from '../../models/preferences';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';

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

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.preferencesSubscription?.unsubscribe();
		this.deckSubscription?.unsubscribe();
	}

	private init() {
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.pipe(debounceTime(200)).subscribe((event) => {
			this.handleDisplayPreferences(this.gameState, event?.preferences);
		});
		const deckEventBus: EventEmitter<any> = this.ow.getMainWindow().deckEventBus;
		const subscriber = new Subscriber<any>(async (event) => {
			if (event) {
				this.gameState = event.state;
				await this.processEvent(event.event);
			}
		});
		subscriber['identifier'] = 'overlay-display';
		this.deckSubscription = deckEventBus.subscribe(subscriber);
	}

	private async processEvent(event) {
		switch (event.name) {
			// In case one event is missing or arrives too fast, we have fallback
			case GameEvent.MATCH_METADATA:
			case GameEvent.LOCAL_PLAYER:
			case GameEvent.OPPONENT:
			case GameEvent.GAME_RUNNING:
			case GameEvent.FIRST_PLAYER:
				console.debug('[overlay-display] received key event from game-state', event.name);
			// Fall-through
			default:
				this.handleDisplayPreferences(this.gameState);
				break;
		}
	}

	private async handleDisplayPreferences(gameState: GameState, preferences: Preferences = null): Promise<void> {
		const prefs = preferences || (await this.prefs.getPreferences());
		const shouldDisplay = this.shouldDisplay(gameState, prefs);

		this.decktrackerDisplayEventBus.next(shouldDisplay);
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
