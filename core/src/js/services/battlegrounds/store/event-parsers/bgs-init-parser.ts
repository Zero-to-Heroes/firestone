import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsHeroSelectionOverview } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroSelectionStage } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-stage';
import { BgsInGameStage } from '../../../../models/battlegrounds/in-game/bgs-in-game-stage';
import { BgsNextOpponentOverviewPanel } from '../../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BgsPostMatchStage } from '../../../../models/battlegrounds/post-match/bgs-post-match-stage';
import { BgsPostMatchStatsPanel } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
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
		const emptyStages: readonly BgsStage[] = BgsInitParser.buildEmptyStages(currentState, prefs);
		return currentState.update({
			globalStats: event.bgsGlobalStats,
			stages: currentState.stages || emptyStages,
		} as BattlegroundsState);
	}

	public static buildEmptyStages(currentState: BattlegroundsState, prefs: Preferences): readonly BgsStage[] {
		return [
			BgsInitParser.buildHeroSelectionStage(),
			BgsInitParser.buildInGameStage(),
			BgsInitParser.buildPostMatchStage(currentState, prefs),
		];
	}

	private static buildHeroSelectionStage(): BgsHeroSelectionStage {
		const panels: readonly BgsPanel[] = [BgsInitParser.buildBgsHeroSelectionOverview()];
		return BgsHeroSelectionStage.create({
			panels: panels,
		} as BgsHeroSelectionStage);
	}

	private static buildBgsHeroSelectionOverview(): BgsHeroSelectionOverview {
		const heroOverview: readonly BgsHeroStat[] = [];
		return BgsHeroSelectionOverview.create({
			heroOverview: heroOverview,
		} as BgsHeroSelectionOverview);
	}

	private static buildInGameStage(): BgsInGameStage {
		const panels: readonly BgsPanel[] = [BgsInitParser.buildBgsNextOpponentOverviewPanel()];
		return BgsInGameStage.create({
			panels: panels,
		} as BgsInGameStage);
	}

	private static buildBgsNextOpponentOverviewPanel(): BgsNextOpponentOverviewPanel {
		return BgsNextOpponentOverviewPanel.create({
			opponentOverview: null,
		} as BgsNextOpponentOverviewPanel);
	}

	private static buildPostMatchStage(currentState: BattlegroundsState, prefs: Preferences): BgsPostMatchStage {
		const stageToRebuild =
			currentState.stages.find(stage => stage.id === 'post-match') || this.createNewStage(currentState);
		const panelToRebuild = BgsInitParser.createNewPanel(currentState, prefs);

		const panels: readonly BgsPanel[] = stageToRebuild.panels.map(panel =>
			panel.id === 'bgs-post-match-stats' ? panelToRebuild : panel,
		);
		return BgsPostMatchStage.create({
			panels: panels,
		} as BgsPostMatchStage);
	}

	private static createNewStage(currentState: BattlegroundsState): BgsInGameStage {
		return BgsPostMatchStage.create({
			panels: [BgsPostMatchStatsPanel.create({} as BgsPostMatchStatsPanel)] as readonly BgsPanel[],
		} as BgsPostMatchStage);
	}

	private static createNewPanel(currentState: BattlegroundsState, prefs: Preferences): BgsPostMatchStatsPanel {
		const player: BgsPlayer = currentState.currentGame?.getMainPlayer();
		return BgsPostMatchStatsPanel.create({
			stats: null,
			newBestUserStats: null,
			globalStats: currentState.globalStats,
			player: player,
			selectedStats: prefs.bgsSelectedTabs2,
			tabs: ['hp-by-turn', 'winrate-per-turn', 'warband-total-stats-by-turn', 'warband-composition-by-turn'],
			// isComputing: false,
			name: 'Live stats',
		} as BgsPostMatchStatsPanel);
	}
}
