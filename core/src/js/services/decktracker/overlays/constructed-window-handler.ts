import { CardsFacadeService } from '@services/cards-facade.service';
import { GameState } from '../../../models/decktracker/game-state';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { FeatureFlags } from '../../feature-flags';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { ConstructedCloseWindowEvent } from '../event/constructed-close-window-event';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class ConstructedWindowHandler extends AbstractOverlayHandler {
	private closedByUser: boolean;
	private gameStarted: boolean;

	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.CONSTRUCTED_WINDOW,
			(prefs) =>
				FeatureFlags.SHOW_CONSTRUCTED_SECONDARY_WINDOW &&
				(prefs.achievementsLiveTracking2 || prefs.guessOpponentArchetype),
			(state) =>
				!this.closedByUser &&
				state &&
				!state.isBattlegrounds() &&
				!state.isMercenaries() &&
				state.metadata?.gameType != null,
			ow,
			prefs,
			allCards,
		);
	}

	public processEvent(gameEvent: GameEvent | GameStateEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		if (gameEvent.type === ConstructedCloseWindowEvent.TYPE) {
			this.closedByUser = true;
			this.updateOverlay(state, showDecktrackerFromGameMode);
		} else if (gameEvent.type === GameEvent.GAME_START) {
			this.closedByUser = false;
			this.gameStarted = true;
			this.updateOverlay(state, showDecktrackerFromGameMode, false, true);
		}
		return state;
	}

	protected shouldShow(canShow: boolean, shouldShowFromState: boolean, prefs: Preferences) {
		if (this.closedByUser || !this.gameStarted) {
			return false;
		}

		// Never close the window automatically, always let the user close it themselves
		return true;
	}
}
