import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsHeroOverview } from '../../../../models/battlegrounds/hero-selection/bgs-hero-overview';
import { BgsHeroSelectionOverview } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroSelectionStage } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-stage';
import { BgsInGameStage } from '../../../../models/battlegrounds/in-game/bgs-in-game-stage';
import { BgsNextOpponentOverviewPanel } from '../../../../models/battlegrounds/in-game/bgs-next-opponent-overview-panel';
import { BgsPostMatchStage } from '../../../../models/battlegrounds/post-match/bgs-post-match-stage';
import { BgsPostMatchStatsPanel } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsInitEvent } from '../events/bgs-init-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsInitParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === 'BgsInitEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsInitEvent): Promise<BattlegroundsState> {
		const emptyStages: readonly BgsStage[] = [
			this.buildHeroSelectionStage(),
			this.buildInGameStage(),
			this.buildPostMatchStage(),
		];
		return currentState.update({
			globalStats: event.bgsGlobalStats,
			stages: currentState.stages || emptyStages,
		} as BattlegroundsState);
	}

	private buildHeroSelectionStage(): BgsHeroSelectionStage {
		const panels: readonly BgsPanel[] = [this.buildBgsHeroSelectionOverview()];
		return BgsHeroSelectionStage.create({
			panels: panels,
		} as BgsHeroSelectionStage);
	}

	private buildBgsHeroSelectionOverview(): BgsHeroSelectionOverview {
		const heroOverview: readonly BgsHeroOverview[] = [];
		return BgsHeroSelectionOverview.create({
			heroOverview: heroOverview,
		} as BgsHeroSelectionOverview);
	}

	private buildInGameStage(): BgsInGameStage {
		const panels: readonly BgsPanel[] = [this.buildBgsNextOpponentOverviewPanel()];
		return BgsInGameStage.create({
			panels: panels,
		} as BgsInGameStage);
	}

	private buildBgsNextOpponentOverviewPanel(): BgsNextOpponentOverviewPanel {
		return BgsNextOpponentOverviewPanel.create({
			opponentOverview: null,
		} as BgsNextOpponentOverviewPanel);
	}

	private buildPostMatchStage(): BgsPostMatchStage {
		const panels: readonly BgsPanel[] = [this.buildBgsPostMatchStatsPanel()];
		return BgsPostMatchStage.create({
			panels: panels,
		} as BgsPostMatchStage);
	}

	private buildBgsPostMatchStatsPanel(): BgsPostMatchStatsPanel {
		return BgsPostMatchStatsPanel.create({
			stats: null,
		} as BgsPostMatchStatsPanel);
	}
}
