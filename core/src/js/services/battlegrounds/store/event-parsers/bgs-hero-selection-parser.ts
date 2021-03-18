import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../../../models/battlegrounds/bgs-panel';
import { BgsStage } from '../../../../models/battlegrounds/bgs-stage';
import { BgsHeroSelectionOverview } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-overview';
import { BgsHeroSelectionStage } from '../../../../models/battlegrounds/hero-selection/bgs-hero-selection-stage';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
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
		//
		const bgsInfo = await this.memoryService.getBattlegroundsInfo();
		const [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(bgsInfo?.game?.AvailableRaces);
		const newHeroSelectionStage: BgsHeroSelectionStage = await this.buildHeroSelectionStage(
			currentState,
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
		currentState: BattlegroundsState,
		heroCardIds: readonly string[],
		stats: BgsStats,
	): Promise<BgsHeroSelectionStage> {
		const panels: readonly BgsPanel[] = [
			await this.buildBgsHeroSelectionOverview(currentState, heroCardIds, stats),
		];
		return BgsHeroSelectionStage.create({
			panels: panels,
		} as BgsHeroSelectionStage);
	}

	private async buildBgsHeroSelectionOverview(
		currentState: BattlegroundsState,
		heroCardIds: readonly string[],
		stats: BgsStats,
	): Promise<BgsHeroSelectionOverview> {
		const heroOverview: readonly BgsHeroStat[] =
			stats?.heroStats?.map(stat =>
				BgsHeroStat.create({
					id: stat.id,
					heroPowerCardId: getHeroPower(stat.id),
					name: stat.name,
					averagePosition: stat.averagePosition,
					popularity: stat.popularity,
					top4: stat.top4 || 0,
					top1: stat.top1 || 0,
					tier: stat.tier,
					playerAveragePosition: stat.playerAveragePosition,
					playerAverageMmr: stat.playerAverageMmr,
					playerAverageMmrGain: stat.playerAverageMmrGain,
					playerAverageMmrLoss: stat.playerAverageMmrLoss,
					playerPopularity: stat.playerPopularity,
					playerGamesPlayed: stat.playerGamesPlayed,
					playerTop4: stat.playerTop4 || 0,
					// playerTop4Percentage:
					// 	stat.playerGamesPlayed === 0 ? 0 : (100 * (stat.playerTop4 || 0)) / stat.playerGamesPlayed,
					playerTop1: stat.playerTop1 || 0,
					// playerTop1Percentage:
					// 	stat.playerGamesPlayed === 0 ? 0 : (100 * (stat.playerTop1 || 0)) / stat.playerGamesPlayed,
					tribesStat: stat.tribesStat,
					warbandStats: stat.warbandStats,
					combatWinrate: stat.combatWinrate,
				}),
			) || [];
		console.log('created hero overview');
		return BgsHeroSelectionOverview.create({
			heroOverview: heroOverview,
			heroOptionCardIds: heroCardIds,
			globalStats: currentState.globalStats,
			heroAchievements: currentState.heroAchievements,
			patchNumber:
				stats?.currentBattlegroundsMetaPatch ||
				(await this.patchConfig.getConf()).currentBattlegroundsMetaPatch,
		} as BgsHeroSelectionOverview);
	}
}
