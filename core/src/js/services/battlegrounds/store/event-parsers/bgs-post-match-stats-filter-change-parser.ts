import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsPostMatchStage } from '../../../../models/battlegrounds/post-match/bgs-post-match-stage';
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
		console.debug('updating new stats', event, currentState);
		const stage = currentState.stages.find(stage => stage.id === 'post-match') as BgsPostMatchStage;
		const panel: BgsPostMatchStatsPanel = stage.panels.find(
			panel => panel.id === 'bgs-post-match-stats',
		) as BgsPostMatchStatsPanel;
		const selectedStats: readonly BgsStatsFilterId[] = panel.selectedStats.map((tab, index) =>
			index === event.tabIndex ? event.statId : tab,
		);
		await this.prefs.updateBgsSelectedTabs(selectedStats);
		console.debug('selectedStats', selectedStats);

		const newPanel = panel.update({
			selectedStats: selectedStats,
		} as BgsPostMatchStatsPanel);
		const newStage = stage.update({
			panels: stage.panels.map(panel =>
				panel.id === 'bgs-post-match-stats' ? newPanel : panel,
			) as readonly BgsPanel[],
		} as BgsPostMatchStage);
		const stages: readonly BgsStage[] = currentState.stages.map(stage =>
			stage.id === newStage.id ? newStage : stage,
		);
		return currentState.update({
			stages: stages,
		} as BattlegroundsState);
	}
}
