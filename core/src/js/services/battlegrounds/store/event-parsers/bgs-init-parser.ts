import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsHeroSelectionOverviewPanel } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsBattlesPanel } from '../../../../models/battlegrounds/in-game/bgs-battles-panel';
import { BgsNextOpponentOverviewPanel } from '../../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BgsPostMatchStatsPanel } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { Preferences } from '../../../../models/preferences';
import { PreferencesService } from '../../../preferences.service';
import { BgsInitEvent } from '../events/bgs-init-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsInitParser implements EventParser {
	constructor(private readonly prefs: PreferencesService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsInitEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsInitEvent): Promise<BattlegroundsState> {
		const prefs = await this.prefs.getPreferences();
		const emptyPanels: readonly BgsPanel[] = BgsInitParser.buildEmptyPanels(currentState, prefs);
		return currentState.update({
			// globalStats: event.bgsGlobalStats,
			panels: currentState.panels || emptyPanels,
		} as BattlegroundsState);
	}

	public static buildEmptyPanels(currentState: BattlegroundsState, prefs: Preferences): readonly BgsPanel[] {
		return [
			BgsInitParser.buildBgsHeroSelectionOverview(),
			BgsInitParser.buildBgsNextOpponentOverviewPanel(),
			BgsInitParser.buildPostMatchStatsPanel(currentState, prefs),
			BgsInitParser.buildBgsBattlesPanel(),
		];
	}

	private static buildBgsHeroSelectionOverview(): BgsHeroSelectionOverviewPanel {
		// const heroOverview: readonly BgsHeroStat[] = [];
		return BgsHeroSelectionOverviewPanel.create({
			heroOptionCardIds: [] as readonly string[],
		} as BgsHeroSelectionOverviewPanel);
	}

	private static buildBgsNextOpponentOverviewPanel(): BgsNextOpponentOverviewPanel {
		return BgsNextOpponentOverviewPanel.create({
			opponentOverview: null,
		} as BgsNextOpponentOverviewPanel);
	}

	private static buildBgsBattlesPanel(): BgsBattlesPanel {
		return BgsBattlesPanel.create({
			faceOffs: [] as readonly BgsFaceOffWithSimulation[],
		} as BgsBattlesPanel);
	}

	private static buildPostMatchStatsPanel(
		currentState: BattlegroundsState,
		prefs: Preferences,
	): BgsPostMatchStatsPanel {
		const player: BgsPlayer = currentState.currentGame?.getMainPlayer();
		return BgsPostMatchStatsPanel.create({
			stats: null,
			newBestUserStats: null,
			// globalStats: currentState.globalStats,
			player: player,
			selectedStats: prefs.bgsSelectedTabs2,
			tabs: ['hp-by-turn', 'winrate-per-turn', 'warband-total-stats-by-turn', 'warband-composition-by-turn'],
			// isComputing: false,
			name: 'Live stats',
		} as BgsPostMatchStatsPanel);
	}
}
