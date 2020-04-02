import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsHeroOverview } from '../../../../models/battlegrounds/hero-selection/bgs-hero-overview';
import { BgsHeroSelectionOverview } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroSelectionStage } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-stage';
import { BgsStats } from '../../../../models/battlegrounds/stats/bgs-stats';
import { BgsHeroSelectionEvent } from '../events/bgs-hero-selection-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsHeroSelectionParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroSelectionEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsHeroSelectionEvent): Promise<BattlegroundsState> {
		const newHeroSelectionStage: BgsHeroSelectionStage = this.buildHeroSelectionStage(
			event.heroCardIds,
			currentState.globalStats,
		);
		const stages: readonly BgsStage[] = currentState.stages.map(stage =>
			stage.id === 'hero-selection' ? newHeroSelectionStage : stage,
		);
		return currentState.update({
			currentPanelId: 'bgs-hero-selection-overview',
			currentStageId: 'hero-selection',
			stages: stages,
			inGame: true,
		} as BattlegroundsState);
	}

	private buildHeroSelectionStage(heroCardIds: readonly string[], stats: BgsStats): BgsHeroSelectionStage {
		const panels: readonly BgsPanel[] = [this.buildBgsHeroSelectionOverview(heroCardIds, stats)];
		return BgsHeroSelectionStage.create({
			panels: panels,
		} as BgsHeroSelectionStage);
	}

	private buildBgsHeroSelectionOverview(heroCardIds: readonly string[], stats: BgsStats): BgsHeroSelectionOverview {
		const heroOverview: readonly BgsHeroOverview[] = stats.heroStats.map(stat =>
			BgsHeroOverview.create({
				heroCardId: stat.id,
				name: stat.name,
				globalAveragePosition: stat.averagePosition,
				globalPopularity: stat.popularity,
				globalTop4: stat.top4 || 0,
				globalTop1: stat.top1 || 0,
				tier: stat.tier,
				ownAveragePosition: stat.playerAveragePosition,
				ownPopularity: stat.playerPopularity,
				ownGamesPlayed: stat.playerGamesPlayed,
				ownTop4: stat.playerTop4 || 0,
				ownTop4Percentage:
					stat.playerGamesPlayed === 0 ? 0 : (100 * (stat.playerTop4 || 0)) / stat.playerGamesPlayed,
				ownTop1: stat.playerTop1 || 0,
				ownTop1Percentage:
					stat.playerGamesPlayed === 0 ? 0 : (100 * (stat.playerTop1 || 0)) / stat.playerGamesPlayed,
				tribesStat: stat.tribesStat,
				warbandStats: stat.warbandStats,
			}),
		);
		console.log('created hero overview', heroOverview);
		return BgsHeroSelectionOverview.create({
			heroOverview: heroOverview,
			heroOptionCardIds: heroCardIds,
		} as BgsHeroSelectionOverview);
	}

	// private buildHeroOverview(heroCardId: string, stats: BgsStats): BgsHeroOverview {
	// 	const stat = stats.heroStats.find(heroStat => heroStat.id === heroCardId);
	// 	return BgsHeroOverview.create({
	// 		heroCardId: heroCardId,
	// 		name: stat.name,
	// 		globalAveragePosition: stat.averagePosition,
	// 		globalPopularity: stat.popularity,
	// 		ownAveragePosition: stat.playerAveragePosition,
	// 		ownPopularity: stat.playerPopularity,
	// 		ownGamesPlayed: stat.playerGamesPlayed,
	// 		tribesStat: stat.tribesStat,
	// 		warbandStats: stat.warbandStats,
	// 	});
	// }
}
