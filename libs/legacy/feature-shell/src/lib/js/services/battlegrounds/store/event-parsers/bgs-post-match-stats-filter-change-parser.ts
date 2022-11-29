import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsPostMatchStatsPanel } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsStatsFilterId } from '../../../../models/battlegrounds/post-match/bgs-stats-filter-id.type';
import { PreferencesService } from '../../../preferences.service';
import { BgsPostMatchStatsFilterChangeEvent } from '../events/bgs-post-match-stats-filter-change-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsPostMatchStatsFilterChangeParser implements EventParser {
	constructor(private readonly prefs: PreferencesService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsPostMatchStatsFilterChangeEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsPostMatchStatsFilterChangeEvent,
	): Promise<BattlegroundsState> {
		const panel: BgsPostMatchStatsPanel = currentState.panels.find(
			(panel) => panel.id === 'bgs-post-match-stats',
		) as BgsPostMatchStatsPanel;
		const selectedStats: readonly BgsStatsFilterId[] = panel.selectedStats.map((tab, index) =>
			index === event.tabIndex ? event.statId : tab,
		);
		await this.prefs.updateBgsSelectedTabs(selectedStats);

		const newPanel = panel.update({
			selectedStats: selectedStats,
		} as BgsPostMatchStatsPanel);
		const panels: readonly BgsPanel[] = currentState.panels.map((panel) =>
			panel.id === newPanel.id ? newPanel : panel,
		);
		return currentState.update({
			panels: panels,
		} as BattlegroundsState);
	}
}
