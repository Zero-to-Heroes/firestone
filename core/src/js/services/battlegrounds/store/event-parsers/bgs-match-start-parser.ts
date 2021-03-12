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
		if (currentState.reconnectOngoing) {
			return currentState;
		} else {
			const reviewId = await this.gameState.getCurrentReviewId();
			const newGame: BgsGame = BgsGame.create({
				reviewId: reviewId,
			} as BgsGame);
			console.debug('created new bgs game with reviewId', reviewId);
			const prefs: Preferences = await this.prefs.getPreferences();
			return currentState.update({
				inGame: true,
				currentGame: newGame,
				forceOpen: prefs.bgsShowHeroSelectionScreen,
				stages: BgsInitParser.buildEmptyStages(currentState, prefs),
			} as BattlegroundsState);
		}
	}
}
