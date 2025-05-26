import { BattlegroundsState, BgsPanel, BgsPostMatchStatsPanel } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsChangePostMatchStatsTabsNumberEvent } from '../events/bgs-change-post-match-stats-tabs-number-event';
import { EventParser } from './_event-parser';

export class BgsChangePostMatchStatsTabsNumberParser implements EventParser {
	constructor(private readonly prefs: PreferencesService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsChangePostMatchStatsTabsNumberEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsChangePostMatchStatsTabsNumberEvent,
	): Promise<BattlegroundsState> {
		const panel: BgsPostMatchStatsPanel = currentState.panels.find(
			(panel) => panel.id === 'bgs-post-match-stats',
		) as BgsPostMatchStatsPanel;
		await this.prefs.updateBgsNumberOfDisplayedTabs(event.tabsNumber);
		const newPanel = panel.update({
			numberOfDisplayedTabs: event.tabsNumber,
		} as BgsPostMatchStatsPanel);
		return currentState.update({
			panels: currentState.panels.map((panel) =>
				panel.id === 'bgs-post-match-stats' ? newPanel : panel,
			) as readonly BgsPanel[],
		} as BattlegroundsState);
	}
}
