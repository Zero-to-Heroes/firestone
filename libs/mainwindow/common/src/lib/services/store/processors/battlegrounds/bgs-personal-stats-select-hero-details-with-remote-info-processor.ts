import {
	BattlegroundsAppState,
	BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent,
	MainWindowState,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class BgsPersonalStatsSelectHeroDetailsWithRemoteInfoProcessor implements Processor {
	public async process(
		event: BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const newBattlegrounds = currentState.battlegrounds.update({
			lastHeroPostMatchStats: event.lastHeroPostMatchStats,
			lastHeroPostMatchStatsHeroId: event.heroId,
		} as BattlegroundsAppState);
		return [
			currentState.update({
				battlegrounds: newBattlegrounds,
			} as MainWindowState),
			null,
		];
	}
}
