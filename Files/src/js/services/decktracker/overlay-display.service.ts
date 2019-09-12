import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { BehaviorSubject, Subscription } from 'rxjs';
import { GameState } from '../../models/decktracker/game-state';
import { GameType } from '../../models/enums/game-type';
import { Preferences } from '../../models/preferences';
import { ScenarioId } from '../../models/scenario-id';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { DeckEvents } from './event-parser/deck-events';

@Injectable()
export class OverlayDisplayService implements OnDestroy {
	// This should not be necessary, but is an additional guard
	private readonly SCENARIO_IDS_WITH_UNAVAILABLE_LISTS: number[] = [
		ScenarioId.DUNGEON_RUN,
		ScenarioId.MONSTER_HUNT,
		ScenarioId.RUMBLE_RUN,
	];

	private decktrackerDisplayEventBus: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	private gameState: GameState;

	private preferencesSubscription: Subscription;
	private deckSubscription: Subscription;

	constructor(private prefs: PreferencesService, private ow: OverwolfService, private logger: NGXLogger) {
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
			this.gameState = event.state;
			await this.processEvent(event.event);
		});
	}

	private async processEvent(event) {
		switch (event.name) {
			case DeckEvents.MATCH_METADATA:
				this.logger.debug('[overlay-display] received MATCH_METADATA event');
				this.handleDisplayPreferences(this.gameState);
				break;
			case DeckEvents.GAME_END:
				this.logger.debug('[overlay-display] received GAME_END event, sending false');
				this.decktrackerDisplayEventBus.next(false);
				break;
		}
	}

	private async handleDisplayPreferences(gameState: GameState, preferences: Preferences = null): Promise<void> {
		const prefs = preferences || (await this.prefs.getPreferences());
		if (!gameState || !gameState.metadata || !gameState.metadata.gameType || !gameState.playerDeck) {
			this.decktrackerDisplayEventBus.next(false);
			return;
		}
		switch (gameState.metadata.gameType as GameType) {
			case GameType.ARENA:
				this.decktrackerDisplayEventBus.next(prefs.decktrackerShowArena);
				return;
			case GameType.CASUAL:
				this.decktrackerDisplayEventBus.next(prefs.decktrackerShowCasual);
				return;
			case GameType.RANKED:
				this.decktrackerDisplayEventBus.next(prefs.decktrackerShowRanked);
				return;
			case GameType.VS_AI:
				this.decktrackerDisplayEventBus.next(
					gameState.playerDeck.deckList.length > 0 &&
						prefs.decktrackerShowPractice &&
						this.SCENARIO_IDS_WITH_UNAVAILABLE_LISTS.indexOf(gameState.metadata.scenarioId) === -1,
				);
				return;
			case GameType.VS_FRIEND:
				this.decktrackerDisplayEventBus.next(prefs.decktrackerShowFriendly);
				return;
			case GameType.FSG_BRAWL:
			case GameType.FSG_BRAWL_1P_VS_AI:
			case GameType.FSG_BRAWL_2P_COOP:
			case GameType.FSG_BRAWL_VS_FRIEND:
			case GameType.TB_1P_VS_AI:
			case GameType.TB_2P_COOP:
			case GameType.TAVERNBRAWL:
				this.decktrackerDisplayEventBus.next(prefs.decktrackerShowTavernBrawl);
				return;
		}
		this.decktrackerDisplayEventBus.next(gameState.playerDeck.deckList.length > 0);
		return;
	}
}
