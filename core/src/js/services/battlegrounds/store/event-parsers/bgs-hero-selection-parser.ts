import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsHeroOverview } from '../../../../models/battlegrounds/hero-selection/bgs-hero-overview';
import { BgsHeroSelectionOverview } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroSelectionStage } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-stage';
import { BgsStats } from '../../../../models/battlegrounds/stats/bgs-stats';
import { PatchesConfigService } from '../../../patches-config.service';
import { MemoryInspectionService } from '../../../plugins/memory-inspection.service';
import { getHeroPower } from '../../bgs-utils';
import { BgsHeroSelectionEvent } from '../events/bgs-hero-selection-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsGlobalInfoUpdatedParser } from './bgs-global-info-updated-parser';
import { EventParser } from './_event-parser';

export class BgsHeroSelectionParser implements EventParser {
	constructor(
		private readonly memoryService: MemoryInspectionService,
		private readonly patchConfig: PatchesConfigService,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroSelectionEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsHeroSelectionEvent): Promise<BattlegroundsState> {
		const bgsInfo = await this.memoryService.getBattlegroundsMatch();
		const [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(bgsInfo?.game?.AvailableRaces);
		const newHeroSelectionStage: BgsHeroSelectionStage = await this.buildHeroSelectionStage(
			event.heroCardIds,
			currentState.globalStats,
		);
		// console.log('races for game', availableRaces, bannedRaces);
		const stages: readonly BgsStage[] = currentState.stages.map(stage =>
			stage.id === 'hero-selection' ? newHeroSelectionStage : stage,
		);
		return currentState.update({
			currentPanelId: 'bgs-hero-selection-overview',
			currentStageId: 'hero-selection',
			stages: stages,
			inGame: true,
			currentGame: currentState.currentGame.update({
				availableRaces: availableRaces,
				bannedRaces: bannedRaces,
			} as BgsGame),
		} as BattlegroundsState);
	}

	private async buildHeroSelectionStage(
		heroCardIds: readonly string[],
		stats: BgsStats,
	): Promise<BgsHeroSelectionStage> {
		const panels: readonly BgsPanel[] = [await this.buildBgsHeroSelectionOverview(heroCardIds, stats)];
		return BgsHeroSelectionStage.create({
			panels: panels,
		} as BgsHeroSelectionStage);
	}

	private async buildBgsHeroSelectionOverview(
		heroCardIds: readonly string[],
		stats: BgsStats,
	): Promise<BgsHeroSelectionOverview> {
		const heroOverview: readonly BgsHeroOverview[] =
			stats?.heroStats?.map(stat =>
				BgsHeroOverview.create({
					heroCardId: stat.id,
					heroPowerCardId: getHeroPower(stat.id),
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
			) || [];
		console.log('created hero overview', heroOverview);
		return BgsHeroSelectionOverview.create({
			heroOverview: heroOverview,
			heroOptionCardIds: heroCardIds,
			patchNumber:
				stats?.currentBattlegroundsMetaPatch ||
				(await this.patchConfig.getConf()).currentBattlegroundsMetaPatch,
		} as BgsHeroSelectionOverview);
	}
}
