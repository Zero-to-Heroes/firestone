import { CardsFacadeService } from '@services/cards-facade.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { PatchesConfigService } from '../../../patches-config.service';
import { BgsStatUpdateEvent } from '../events/bgs-stat-update-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsStatUpdateParser implements EventParser {
	constructor(private readonly cards: CardsFacadeService, private readonly patchesService: PatchesConfigService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsStatUpdateEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsStatUpdateEvent): Promise<BattlegroundsState> {
		return null;

		// const bgsMatchStats = event.newGameStats?.stats?.filter((stat) => stat.gameMode === 'battlegrounds');
		// if (!bgsMatchStats || bgsMatchStats.length === 0) {
		// 	return currentState;
		// }

		// const currentBattlegroundsMetaPatch =
		// 	currentState.globalStats?.currentBattlegroundsMetaPatch ||
		// 	(await this.patchesService.getConf()).currentBattlegroundsMetaPatch;
		// const bgsStatsForCurrentPatch = bgsMatchStats.filter(
		// 	(stat) => stat.buildNumber >= currentBattlegroundsMetaPatch,
		// );

		// 	'[bgs-stat-update] bgsStatsForCurrentPatch',
		// 	bgsStatsForCurrentPatch.length,
		// 	currentBattlegroundsMetaPatch,
		// );

		// const heroStatsWithPlayer: readonly BgsHeroStat[] = BgsStatUpdateParser.buildHeroStats(
		// 	currentState.globalStats,
		// 	bgsStatsForCurrentPatch,
		// 	this.cards,
		// );

		// 	'[bgs-stat-update] heroStatsWithPlayer',
		// 	heroStatsWithPlayer.length > 0 && heroStatsWithPlayer[0].playerGamesPlayed,
		// );
		// const statsWithPlayer = currentState.globalStats?.update({
		// 	heroStats: heroStatsWithPlayer,
		// 	currentBattlegroundsMetaPatch: currentBattlegroundsMetaPatch,
		// } as BgsStats);
		// 		// return currentState.update({
		// 	globalStats: statsWithPlayer,
		// } as BattlegroundsState);
	}
}
