// export class BgsRequestNewGlobalStatsLoadProcessor implements Processor {
// 	constructor(private readonly globalStatsService: BgsGlobalStatsService) {}

// 	public async process(
// 		event: BgsRequestNewGlobalStatsLoadEvent,
// 		currentState: MainWindowState,
// 		history,
// 		navigationState: NavigationState,
// 	): Promise<[MainWindowState, NavigationState]> {
// 		const newStats = await this.globalStatsService.loadGlobalStats(event.tribes, event.timePeriod);
// 		return [
// 			currentState.update({
// 				battlegrounds: currentState.battlegrounds.update({
// 					loading: false,
// 					// globalStats: newStats,
// 				} as BattlegroundsAppState),
// 			} as MainWindowState),
// 			null,
// 		];
// 	}
// }
