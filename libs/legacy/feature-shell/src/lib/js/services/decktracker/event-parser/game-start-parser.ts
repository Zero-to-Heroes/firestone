import { BgsBoardHighlighterService, BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import {
	BattlegroundsState,
	BgsBattlesPanel,
	BgsFaceOffWithSimulation,
	BgsGame,
	BgsHeroSelectionOverviewPanel,
	BgsNextOpponentOverviewPanel,
	BgsPanel,
	BgsPlayer,
	BgsPostMatchStatsPanel,
	DeckState,
	GameState,
} from '@firestone/game-state';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { GameStateEvent } from '../../../models/decktracker/game-state-event';
import { GameEvent } from '../../../models/game-event';
import { GameEventsEmitterService } from '../../game-events-emitter.service';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { ReviewIdService } from '../../review-id.service';
import { EventParser } from './event-parser';

export class GameStartParser implements EventParser {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly reviewIdService: ReviewIdService,
		private readonly highlighter: BgsBoardHighlighterService,
		private readonly i18n: LocalizationFacadeService,
		private readonly nav: BgsInGameWindowNavigationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !state || !state.reconnectOngoing;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const initialState = Object.assign(new GameState(), {
			gameStarted: true,
			matchStartTimestamp: gameEvent.additionalData.timestamp,
			playerDeck: DeckState.create({
				isFirstPlayer: false,
			} as DeckState),
			opponentDeck: DeckState.create({
				isFirstPlayer: false,
				isOpponent: true,
			} as DeckState),
			spectating: gameEvent.additionalData.spectating,
			reconnectOngoing: currentState?.reconnectOngoing,
		} as GameState);

		if (initialState.reconnectOngoing) {
			console.warn('reconnect, returning');
			return initialState;
		}

		const prefs: Preferences = await this.prefs.getPreferences();
		this.highlighter.resetHighlights();
		const newBgState = currentState.bgState.update({
			currentGame: new BgsGame(),
			panels: buildEmptyPanels(currentState.bgState, prefs, this.i18n),
			heroSelectionDone: false,
			postMatchStats: undefined,
		});
		return initialState.update({
			bgState: newBgState,
		});
	}

	async sideEffects(gameEvent: GameEvent | GameStateEvent, eventsEmtter: GameEventsEmitterService) {
		const reviewId = this.reviewIdService.reviewId$$.value;
		eventsEmtter.allEvents.next({
			type: GameEvent.REVIEW_ID,
			additionalData: { reviewId },
		} as GameEvent);
		this.nav.forcedStatus$$.next(null);
	}

	event(): string {
		return GameEvent.GAME_START;
	}
}

const buildEmptyPanels = (
	currentState: BattlegroundsState,
	prefs: Preferences,
	i18n: LocalizationFacadeService,
): readonly BgsPanel[] => {
	return [
		buildBgsHeroSelectionOverview(i18n),
		buildBgsNextOpponentOverviewPanel(i18n),
		buildPostMatchStatsPanel(currentState, prefs, i18n),
		buildBgsBattlesPanel(i18n),
	];
};

const buildBgsHeroSelectionOverview = (i18n: LocalizationFacadeService): BgsHeroSelectionOverviewPanel => {
	return BgsHeroSelectionOverviewPanel.create({
		name: i18n.translateString('battlegrounds.menu.hero-selection'),
		heroOptions: [],
	});
};

const buildBgsNextOpponentOverviewPanel = (i18n: LocalizationFacadeService): BgsNextOpponentOverviewPanel => {
	return BgsNextOpponentOverviewPanel.create({
		name: i18n.translateString('battlegrounds.menu.opponent'),
		opponentOverview: null,
	} as BgsNextOpponentOverviewPanel);
};

const buildBgsBattlesPanel = (i18n: LocalizationFacadeService): BgsBattlesPanel => {
	return BgsBattlesPanel.create({
		name: i18n.translateString('battlegrounds.menu.simulator'),
		faceOffs: [] as readonly BgsFaceOffWithSimulation[],
	} as BgsBattlesPanel);
};

const buildPostMatchStatsPanel = (
	currentState: BattlegroundsState,
	prefs: Preferences,
	i18n: LocalizationFacadeService,
): BgsPostMatchStatsPanel => {
	const player: BgsPlayer = currentState.currentGame?.getMainPlayer();
	return BgsPostMatchStatsPanel.create({
		name: i18n.translateString('battlegrounds.menu.live-stats'),
		stats: null,
		newBestUserStats: null,
		// globalStats: currentState.globalStats,
		player: player,
		tabs: ['hp-by-turn', 'winrate-per-turn', 'warband-total-stats-by-turn', 'warband-composition-by-turn'],
		// isComputing: false,
	} as BgsPostMatchStatsPanel);
};
