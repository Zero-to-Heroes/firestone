import { SceneMode } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { GameState } from '../../../models/decktracker/game-state';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class PlayerDeckOverlayHandler extends AbstractOverlayHandler {
	private closedByUser: boolean;
	private onGameScreen: boolean;
	private gameStarted: boolean;

	constructor(ow: OverwolfService, allCards: CardsFacadeService, prefs: PreferencesService) {
		super(
			OverwolfService.DECKTRACKER_WINDOW,
			(prefs) => true,
			(state, prefs, showDecktrackerFromGameMode) =>
				!this.closedByUser && !state.isBattlegrounds() && showDecktrackerFromGameMode,
			ow,
			prefs,
			allCards,
			false,
		);
		this.name = 'decktracker-player';
	}

	public processEvent(gameEvent: GameEvent | GameStateEvent, state: GameState, showDecktrackerFromGameMode: boolean) {
		super.processEvent(gameEvent, state, showDecktrackerFromGameMode);
		if (gameEvent.type === 'CLOSE_TRACKER') {
			this.closedByUser = true;
			this.updateOverlay(state, showDecktrackerFromGameMode);
		} else if (gameEvent.type === GameEvent.GAME_START) {
			this.closedByUser = false;
			this.gameStarted = true;
			console.log(`[${this.name}] game started`);
			this.updateOverlay(state, showDecktrackerFromGameMode, false, true);
		} else if (gameEvent.type === GameEvent.SCENE_CHANGED_MINDVISION) {
			this.onGameScreen = (gameEvent as GameEvent).additionalData.scene === SceneMode.GAMEPLAY;
			console.log(`[${this.name}] received scene changed`, (gameEvent as GameEvent).additionalData.scene);
			this.updateOverlay(state, showDecktrackerFromGameMode, false, true);
		}
		// It looks like that, for some players, the mindvision event is not raised
		else if (gameEvent.type === GameEvent.SCENE_CHANGED) {
			this.onGameScreen = (gameEvent as GameEvent).additionalData.scene === 'scene_gameplay';
			console.log(`[${this.name}] received GEP scene changed`, (gameEvent as GameEvent).additionalData.scene);
			this.updateOverlay(state, showDecktrackerFromGameMode, false, true);
		}
	}

	protected shouldShow(canShow: boolean, shouldShowFromState: boolean, prefs: Preferences, state: GameState) {
		if (this.closedByUser || !this.gameStarted) {
			console.log(`[${this.name}] should not show`, this.closedByUser, this.gameStarted);
			return false;
		}

		if (!prefs.decktrackerCloseOnGameEnd) {
			return shouldShowFromState && state?.gameStarted && state.metadata?.formatType && !state.isBattlegrounds();
		}

		// We explicitely don't check for null, so that if the memory updates are broken
		// we still somehow show the info
		if (this.onGameScreen === false) {
			// console.log(`[${this.name}] not on game screen`, this.onGameScreen);
			return false;
		}

		return canShow && shouldShowFromState;
	}
}
