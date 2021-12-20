import { SceneMode } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { GameState } from '../../../models/decktracker/game-state';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';
import { Preferences } from '../../../models/preferences';
import { OverwolfService } from '../../overwolf.service';
import { MemoryInspectionService } from '../../plugins/memory-inspection.service';
import { PreferencesService } from '../../preferences.service';
import { AbstractOverlayHandler } from './_abstract-overlay-handler';

export class PlayerDeckOverlayHandler extends AbstractOverlayHandler {
	private closedByUser: boolean;
	private onGameScreen: boolean;
	private gameStarted: boolean;

	constructor(
		ow: OverwolfService,
		allCards: CardsFacadeService,
		prefs: PreferencesService,
		private readonly memory: MemoryInspectionService,
	) {
		super(
			OverwolfService.DECKTRACKER_WINDOW,
			(prefs) => true,
			(state, prefs, showDecktrackerFromGameMode) =>
				!this.closedByUser &&
				state &&
				!state.isBattlegrounds() &&
				!state.isMercenaries() &&
				showDecktrackerFromGameMode,
			ow,
			prefs,
			allCards,
			process.env.NODE_ENV !== 'production',
		);
		this.name = 'decktracker-player';
		this.init();
	}

	private async init() {
		this.onGameScreen = (await this.memory.getCurrentSceneFromMindVision()) === SceneMode.GAMEPLAY;
	}

	public processEvent(
		gameEvent: GameEvent | GameStateEvent,
		state: GameState,
		showDecktrackerFromGameMode: boolean,
	): GameState {
		let result = super.processEvent(gameEvent, state, showDecktrackerFromGameMode);
		// if (gameEvent.type === 'CLOSE_TRACKER') {
		// 	result = result.update({
		// 		playerTrackerClosedByUser: true,
		// 	});
		// 	this.closedByUser = true;
		// 	this.updateOverlay(state, showDecktrackerFromGameMode);
		// } else
		if (gameEvent.type === GameEvent.GAME_START) {
			this.closedByUser = false;
			this.gameStarted = true;
			result = result.update({
				playerTrackerClosedByUser: false,
			});
			console.debug(`[${this.name}] game started`);
			this.updateOverlay(state, showDecktrackerFromGameMode, false, true);
		} else if (gameEvent.type === GameEvent.SCENE_CHANGED_MINDVISION) {
			this.onGameScreen = (gameEvent as GameEvent).additionalData.scene === SceneMode.GAMEPLAY;
			console.log(`[${this.name}] received scene changed`, (gameEvent as GameEvent).additionalData.scene);
			this.updateOverlay(state, showDecktrackerFromGameMode, false, true);
		}
		// It looks like that, for some players, the mindvision event is not raised
		// else if (gameEvent.type === GameEvent.SCENE_CHANGED) {
		// 	this.onGameScreen = (gameEvent as GameEvent).additionalData.scene === 'scene_gameplay';
		// 	console.log(`[${this.name}] received GEP scene changed`, (gameEvent as GameEvent).additionalData.scene);
		// 	this.updateOverlay(state, showDecktrackerFromGameMode, false, true);
		// }
		return result;
	}

	protected shouldShow(canShow: boolean, shouldShowFromState: boolean, prefs: Preferences, state: GameState) {
		if (this.closedByUser || !this.gameStarted) {
			return false;
		}

		if (!prefs.decktrackerCloseOnGameEnd) {
			return (
				shouldShowFromState &&
				state &&
				state?.gameStarted &&
				state.metadata?.formatType &&
				!state.isBattlegrounds() &&
				!state.isMercenaries()
			);
		}

		// We explicitely don't check for null, so that if the memory updates are broken
		// we still somehow show the info
		if (this.onGameScreen === false) {
			return false;
		}

		return canShow && shouldShowFromState;
	}
}
