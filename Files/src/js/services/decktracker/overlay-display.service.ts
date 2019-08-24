import { Injectable } from '@angular/core';
import { GameState } from '../../models/decktracker/game-state';
import { GameType } from '../../models/enums/game-type';
import { Preferences } from '../../models/preferences';
import { ScenarioId } from '../../models/scenario-id';
import { PreferencesService } from '../preferences.service';

@Injectable()
export class OverlayDisplayService {
	// This should not be necessary, but is an additional guard
	private readonly SCENARIO_IDS_WITH_UNAVAILABLE_LISTS: number[] = [
		ScenarioId.DUNGEON_RUN,
		ScenarioId.MONSTER_HUNT,
		ScenarioId.RUMBLE_RUN,
	];

	constructor(private prefs: PreferencesService) {}

	public async shouldDisplayOverlay(gameState: GameState, preferences: Preferences = null): Promise<boolean> {
		const prefs = preferences || (await this.prefs.getPreferences());
		console.log('merged prefs', prefs, gameState);
		if (!gameState || !gameState.metadata || !gameState.metadata.gameType || !gameState.playerDeck || !gameState.playerDeck.deckList) {
			return false;
		}
		switch (gameState.metadata.gameType as GameType) {
			case GameType.ARENA:
				return gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowArena;
			case GameType.CASUAL:
				return gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowCasual;
			case GameType.RANKED:
				return gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowRanked;
			case GameType.VS_AI:
				return (
					gameState.playerDeck.deckList.length > 0 &&
					prefs.decktrackerShowPractice &&
					this.SCENARIO_IDS_WITH_UNAVAILABLE_LISTS.indexOf(gameState.metadata.scenarioId) === -1
				);
			case GameType.VS_FRIEND:
				return gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowFriendly;
			case GameType.FSG_BRAWL:
			case GameType.FSG_BRAWL_1P_VS_AI:
			case GameType.FSG_BRAWL_2P_COOP:
			case GameType.FSG_BRAWL_VS_FRIEND:
			case GameType.TB_1P_VS_AI:
			case GameType.TB_2P_COOP:
			case GameType.TAVERNBRAWL:
				return gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowTavernBrawl;
		}
		return gameState.playerDeck.deckList.length > 0;
	}
}
