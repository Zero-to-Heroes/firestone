import { BgsPlayer } from '@firestone-hs/hs-replay-xml-parser';
import { GameTag, Race } from '@firestone-hs/reference-data';
import { BgsFaceOffWithSimulation } from '@legacy-import/src/lib/js/models/battlegrounds/bgs-face-off-with-simulation';
import { BgsPanel } from '@legacy-import/src/lib/js/models/battlegrounds/bgs-panel';
import { BgsHeroSelectionOverviewPanel } from '@legacy-import/src/lib/js/models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsBattlesPanel } from '@legacy-import/src/lib/js/models/battlegrounds/in-game/bgs-battles-panel';
import { BgsNextOpponentOverviewPanel } from '@legacy-import/src/lib/js/models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BgsPostMatchStatsPanel } from '@legacy-import/src/lib/js/models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { Preferences } from '../../../../models/preferences';
import { GameStateService } from '../../../decktracker/game-state.service';
import { PreferencesService } from '../../../preferences.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsMatchStartEvent } from '../events/bgs-match-start-event';
import { EventParser } from './_event-parser';

export class BgsMatchStartParser implements EventParser {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly gameState: GameStateService,
		private readonly i18n: LocalizationFacadeService,
	) {}

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
					panels: buildEmptyPanels(currentState, prefs, this.i18n),
					heroSelectionDone: false,
					currentPanelId: 'bgs-hero-selection-overview',
					highlightedMinions: [] as readonly string[],
					highlightedTribes: [] as readonly Race[],
					highlightedMechanics: [] as readonly GameTag[],
					postMatchStats: undefined,
				} as BattlegroundsState);
			}

			console.log('created new bgs game with reviewId', reviewId);
			return currentState.update({
				inGame: true,
				forceOpen: prefs.bgsShowHeroSelectionScreen,
				panels: buildEmptyPanels(currentState, prefs, this.i18n),
				heroSelectionDone: false,
				currentPanelId: 'bgs-hero-selection-overview',
				spectating: event.spectating,
				highlightedMinions: [] as readonly string[],
				highlightedTribes: [] as readonly Race[],
				highlightedMechanics: [] as readonly GameTag[],
				postMatchStats: undefined,
			} as BattlegroundsState);
		}
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
		heroOptionCardIds: [] as readonly string[],
	} as BgsHeroSelectionOverviewPanel);
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
		selectedStats: prefs.bgsSelectedTabs2,
		tabs: ['hp-by-turn', 'winrate-per-turn', 'warband-total-stats-by-turn', 'warband-composition-by-turn'],
		// isComputing: false,
	} as BgsPostMatchStatsPanel);
};
