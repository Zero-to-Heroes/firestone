import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { Preferences } from '../../../../models/preferences';
import { PreferencesService } from '../../../preferences.service';
import { BgsStartComputingPostMatchStatsEvent } from '../events/bgs-start-computing-post-match-stats-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsStartComputingPostMatchStatsParser implements EventParser {
	constructor(private readonly prefs: PreferencesService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsStartComputingPostMatchStatsEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BgsStartComputingPostMatchStatsEvent,
	): Promise<BattlegroundsState> {
		// const newPostMatchStatsStage: BgsPostMatchStage = this.buildPostMatchStage(currentState);
		// const stages: readonly BgsStage[] = currentState.stages.map(stage =>
		// 	stage.id === newPostMatchStatsStage.id ? newPostMatchStatsStage : stage,
		// );
		const prefs: Preferences = await this.prefs.getPreferences();
		return currentState.update({
			// stages: stages,
			currentStageId: 'post-match',
			currentPanelId: 'bgs-post-match-stats',
			forceOpen: prefs.bgsEnableApp && prefs.bgsForceShowPostMatchStats && prefs.bgsFullToggle ? true : false,
			currentGame: currentState.currentGame.update({
				gameEnded: true,
				replayXml: event.replayXml,
			} as BgsGame),
		} as BattlegroundsState);
	}

	// private buildPostMatchStage(currentState: BattlegroundsState): BgsPostMatchStage {
	// 	const stageToRebuild = currentState.stages.find(stage => stage.id === 'post-match') || this.createNewStage();
	// 	const panelToRebuild = this.createNewPanel();

	// 	const panels: readonly BgsPanel[] = stageToRebuild.panels.map(panel =>
	// 		panel.id === 'bgs-post-match-stats' ? panelToRebuild : panel,
	// 	);
	// 	return BgsPostMatchStage.create({
	// 		panels: panels,
	// 	} as BgsPostMatchStage);
	// }

	// private createNewStage(): BgsInGameStage {
	// 	return BgsPostMatchStage.create({
	// 		panels: [BgsPostMatchStatsPanel.create({} as BgsPostMatchStatsPanel)] as readonly BgsPanel[],
	// 	} as BgsPostMatchStage);
	// }

	// private createNewPanel(): BgsPostMatchStatsPanel {
	// 	return BgsPostMatchStatsPanel.create({
	// 		// isComputing: true,
	// 		name: 'Computing final stats',
	// 	} as BgsPostMatchStatsPanel);
	// }
}
