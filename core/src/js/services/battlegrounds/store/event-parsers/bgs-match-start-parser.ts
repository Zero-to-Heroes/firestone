import { Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { Preferences } from '../../../../models/preferences';
import { GameStateService } from '../../../decktracker/game-state.service';
import { PreferencesService } from '../../../preferences.service';
import { BgsMatchStartEvent } from '../events/bgs-match-start-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsInitParser } from './bgs-init-parser';
import { EventParser } from './_event-parser';

export class BgsMatchStartParser implements EventParser {
	constructor(private readonly prefs: PreferencesService, private readonly gameState: GameStateService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsMatchStartEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsMatchStartEvent): Promise<BattlegroundsState> {
		console.log('received BGS match start event', event.spectating, event.simpleInit);
		if (currentState.reconnectOngoing) {
			console.warn('reconnect, returning');
			return currentState;
		} else {
			const reviewId = await this.gameState.getCurrentReviewId();
			const prefs: Preferences = await this.prefs.getPreferences();
			if (event.simpleInit) {
				const newGame: BgsGame = BgsGame.create({
					reviewId: reviewId,
				} as BgsGame);
				return currentState.update({
					inGame: false, // We don't know yet if this is a BG game
					currentGame: newGame,
					panels: BgsInitParser.buildEmptyPanels(currentState, prefs),
					heroSelectionDone: false,
					currentPanelId: 'bgs-hero-selection-overview',
					highlightedMinions: [] as readonly string[],
					highlightedTribes: [] as readonly Race[],
					postMatchStats: undefined,
				} as BattlegroundsState);
			}

			console.log('created new bgs game with reviewId', reviewId);
			return currentState.update({
				inGame: true,
				forceOpen: prefs.bgsShowHeroSelectionScreen,
				panels: BgsInitParser.buildEmptyPanels(currentState, prefs),
				heroSelectionDone: false,
				currentPanelId: 'bgs-hero-selection-overview',
				spectating: event.spectating,
				highlightedMinions: [] as readonly string[],
				highlightedTribes: [] as readonly Race[],
				postMatchStats: undefined,
			} as BattlegroundsState);
		}
	}
}
