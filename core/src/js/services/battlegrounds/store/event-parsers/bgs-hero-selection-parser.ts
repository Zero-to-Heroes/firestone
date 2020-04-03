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
				heroPowerCardId: this.getHeroPower(stat.id),
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

	private getHeroPower(heroCardId: string): string {
		switch (heroCardId) {
			case 'TB_BaconShop_HERO_01':
				return 'TB_BaconShop_HP_001';
			case 'TB_BaconShop_HERO_02':
				return 'TB_BaconShop_HP_011';
			case 'TB_BaconShop_HERO_08':
				return 'TB_BaconShop_HP_069';
			case 'TB_BaconShop_HERO_11':
				return 'TB_BaconShop_HP_019';
			case 'TB_BaconShop_HERO_12':
				return 'TB_BaconShop_HP_041a';
			case 'TB_BaconShop_HERO_14':
				return 'TB_BaconShop_HP_037a';
			case 'TB_BaconShop_HERO_15':
				return 'TB_BaconShop_HP_010';
			case 'TB_BaconShop_HERO_16':
				return 'TB_BaconShop_HP_044';
			case 'TB_BaconShop_HERO_17':
				return 'TB_BaconShop_HP_015';
			case 'TB_BaconShop_HERO_18':
				return 'TB_BaconShop_HP_027';
			case 'TB_BaconShop_HERO_20':
				return 'TB_BaconShop_HP_018';
			case 'TB_BaconShop_HERO_21':
				return 'TB_BaconShop_HP_020';
			case 'TB_BaconShop_HERO_22':
				return 'TB_BaconShop_HP_024';
			case 'TB_BaconShop_HERO_23':
				return 'TB_BaconShop_HP_022';
			case 'TB_BaconShop_HERO_25':
				return 'TB_BaconShop_HP_049';
			case 'TB_BaconShop_HERO_27':
				return 'TB_BaconShop_HP_014';
			case 'TB_BaconShop_HERO_28':
				return 'TB_BaconShop_HP_028';
			case 'TB_BaconShop_HERO_30':
				return 'TB_BaconShop_HP_043';
			case 'TB_BaconShop_HERO_31':
				return 'TB_BaconShop_HP_009';
			case 'TB_BaconShop_HERO_33':
				return 'TB_BaconShop_HP_033';
			case 'TB_BaconShop_HERO_34':
				return 'TB_BaconShop_HP_035';
			case 'TB_BaconShop_HERO_35':
				return 'TB_BaconShop_HP_039';
			case 'TB_BaconShop_HERO_36':
				return 'TB_BaconShop_HP_042';
			case 'TB_BaconShop_HERO_37':
				return 'TB_BaconShop_HP_036';
			case 'TB_BaconShop_HERO_39':
				return 'TB_BaconShop_HP_040';
			case 'TB_BaconShop_HERO_40':
				return 'TB_BaconShop_HP_057';
			case 'TB_BaconShop_HERO_41':
				return 'TB_BaconShop_HP_046';
			case 'TB_BaconShop_HERO_42':
				return 'TB_BaconShop_HP_047';
			case 'TB_BaconShop_HERO_44':
				return 'TB_BaconShop_HP_050';
			case 'TB_BaconShop_HERO_45':
				return 'TB_BaconShop_HP_053';
			case 'TB_BaconShop_HERO_47':
				return 'TB_BaconShop_HP_051';
			case 'TB_BaconShop_HERO_49':
				return 'TB_BaconShop_HP_054';
			case 'TB_BaconShop_HERO_52':
				return 'TB_BaconShop_HP_061';
			case 'TB_BaconShop_HERO_53':
				return 'TB_BaconShop_HP_062';
			case 'TB_BaconShop_HERO_55':
				return 'TB_BaconShop_HP_056';
			case 'TB_BaconShop_HERO_56':
				return 'TB_BaconShop_HP_064';
			case 'TB_BaconShop_HERO_57':
				return 'TB_BaconShop_HP_063';
			case 'TB_BaconShop_HERO_58':
				return 'TB_BaconShop_HP_052';
		}
	}
}
