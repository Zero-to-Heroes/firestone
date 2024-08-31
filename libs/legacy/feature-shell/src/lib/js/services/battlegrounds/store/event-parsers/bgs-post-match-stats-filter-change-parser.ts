import { BattlegroundsState, BgsPanel, BgsPostMatchStatsPanel, BgsStatsFilterId } from '@firestone/battlegrounds/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsPostMatchStatsFilterChangeEvent } from '../events/bgs-post-match-stats-filter-change-event';
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
