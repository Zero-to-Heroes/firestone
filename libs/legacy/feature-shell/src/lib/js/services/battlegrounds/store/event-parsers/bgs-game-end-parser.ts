import { EventEmitter } from '@angular/core';
import { GameTag, Race } from '@firestone-hs/reference-data';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import {
	BattlegroundsState,
	BgsBattlesPanel,
	BgsGame,
	BgsPanel,
	BgsPlayer,
	BgsPostMatchStats,
	BgsPostMatchStatsPanel,
} from '@firestone/battlegrounds/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { MainWindowStoreEvent } from '../../../mainwindow/store/events/main-window-store-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsGameEndEvent } from '../events/bgs-game-end-event';
import { EventParser } from './_event-parser';

// TODO: coins wasted doesn't take into account hero powers that let you have more coins (Bel'ial)
export class BgsGameEndParser implements EventParser {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
		private readonly stateUpdaterProvider: () => EventEmitter<MainWindowStoreEvent>,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsGameEndEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsGameEndEvent): Promise<BattlegroundsState> {
		if (event.reviewId !== currentState.currentGame?.reviewId) {
			console.log(
				'[bgs-game-end] a new game already started, doing nothing here',
				currentState.currentGame?.reviewId,
				event.reviewId,
			);
			return currentState;
		}

		const prefs: Preferences = await this.prefs.getPreferences();

		console.debug('will build post-match info', prefs.bgsForceShowPostMatchStats2);
		const newBestUserStats: readonly BgsBestStat[] = event.newBestStats;
		const newPostMatchStatsStage: BgsPostMatchStatsPanel = this.buildPostMatchPanel(
			currentState,
			event.postMatchStats,
			newBestUserStats,
			prefs,
		);
		const newBattlesPanel: BgsBattlesPanel = this.buildBattlesPanel(currentState, prefs);
		const panels: readonly BgsPanel[] = currentState.panels
			.map((panel) => (panel.id === newPostMatchStatsStage.id ? newPostMatchStatsStage : panel))
			.map((panel) => (panel.id === newBattlesPanel.id ? newBattlesPanel : panel));
		return currentState.update({
			panels: panels,
			// currentPanelId: 'bgs-post-match-stats',
			forceOpen: prefs.bgsEnableApp && prefs.bgsForceShowPostMatchStats2 && prefs.bgsFullToggle ? true : false,
			highlightedMinions: [] as readonly string[],
			highlightedTribes: [] as readonly Race[],
			highlightedMechanics: [] as readonly GameTag[],
			heroSelectionDone: false,
			currentGame: currentState.currentGame.update({
				gameEnded: true,
				reviewId: event.reviewId,
				phase: 'recruit',
			} as BgsGame),
		} as BattlegroundsState);
	}

	private buildBattlesPanel(currentState: BattlegroundsState, prefs: Preferences): BgsBattlesPanel {
		// TODO: add somewhere the info about whether the user is a premium subscriber
		// Let's use the face-offs directly from the game state, instead of duplicating the info
		return BgsBattlesPanel.create({
			name: this.i18n.translateString('battlegrounds.menu.simulator'),
			faceOffs: null, // currentState.currentGame.faceOffs,
		} as BgsBattlesPanel);
	}

	private buildPostMatchPanel(
		currentState: BattlegroundsState,
		postMatchStats: BgsPostMatchStats,
		newBestUserStats: readonly BgsBestStat[],
		prefs: Preferences,
	): BgsPostMatchStatsPanel {
		const player: BgsPlayer = currentState.currentGame.getMainPlayer();
		const finalPosition = player?.leaderboardPlace;
		console.debug('post match stats');
		return BgsPostMatchStatsPanel.create({
			stats: postMatchStats,
			newBestUserStats: newBestUserStats,
			// globalStats: currentState.globalStats,
			player: player,
			selectedStats: prefs.bgsSelectedTabs2.includes('battles') ? ['hp-by-turn'] : prefs.bgsSelectedTabs2,
			tabs: ['hp-by-turn', 'winrate-per-turn', 'warband-total-stats-by-turn', 'warband-composition-by-turn'],
			name: this.i18n.translateString('battlegrounds.post-match-stats.final-position', {
				position: finalPosition,
			}),
		});
	}
}
