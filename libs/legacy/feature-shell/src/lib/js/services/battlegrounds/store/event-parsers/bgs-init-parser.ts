// export class BgsInitParser implements EventParser {
// constructor(private readonly prefs: PreferencesService, private readonly i18n: LocalizationFacadeService) {}

// public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
// 	return state && gameEvent.type === 'BgsInitEvent';
// }

// public async parse(currentState: BattlegroundsState, event: BgsInitEvent): Promise<BattlegroundsState> {
// 	const prefs = await this.prefs.getPreferences();
// 	const emptyPanels: readonly BgsPanel[] = BgsInitParser.buildEmptyPanels(currentState, prefs, this.i18n);
// 	return currentState.update({
// 		// globalStats: event.bgsGlobalStats,
// 		panels: currentState.panels || emptyPanels,
// 	} as BattlegroundsState);
// }

// public static buildEmptyPanels(
// 	currentState: BattlegroundsState,
// 	prefs: Preferences,
// 	i18n: LocalizationFacadeService,
// ): readonly BgsPanel[] {
// 	return [
// 		BgsInitParser.buildBgsHeroSelectionOverview(i18n),
// 		BgsInitParser.buildBgsNextOpponentOverviewPanel(i18n),
// 		BgsInitParser.buildPostMatchStatsPanel(currentState, prefs, i18n),
// 		BgsInitParser.buildBgsBattlesPanel(i18n),
// 	];
// }

// private static buildBgsHeroSelectionOverview(i18n: LocalizationFacadeService): BgsHeroSelectionOverviewPanel {
// 	return BgsHeroSelectionOverviewPanel.create({
// 		name: i18n.translateString('battlegrounds.menu.hero-selection'),
// 		heroOptionCardIds: [] as readonly string[],
// 	} as BgsHeroSelectionOverviewPanel);
// }

// private static buildBgsNextOpponentOverviewPanel(i18n: LocalizationFacadeService): BgsNextOpponentOverviewPanel {
// 	return BgsNextOpponentOverviewPanel.create({
// 		name: i18n.translateString('battlegrounds.menu.opponent'),
// 		opponentOverview: null,
// 	} as BgsNextOpponentOverviewPanel);
// }

// private static buildBgsBattlesPanel(i18n: LocalizationFacadeService): BgsBattlesPanel {
// 	return BgsBattlesPanel.create({
// 		name: i18n.translateString('battlegrounds.menu.simulator'),
// 		faceOffs: [] as readonly BgsFaceOffWithSimulation[],
// 	} as BgsBattlesPanel);
// }

// private static buildPostMatchStatsPanel(
// 	currentState: BattlegroundsState,
// 	prefs: Preferences,
// 	i18n: LocalizationFacadeService,
// ): BgsPostMatchStatsPanel {
// 	const player: BgsPlayer = currentState.currentGame?.getMainPlayer();
// 	return BgsPostMatchStatsPanel.create({
// 		name: i18n.translateString('battlegrounds.menu.live-stats'),
// 		stats: null,
// 		newBestUserStats: null,
// 		// globalStats: currentState.globalStats,
// 		player: player,
// 		selectedStats: prefs.bgsSelectedTabs2,
// 		tabs: ['hp-by-turn', 'winrate-per-turn', 'warband-total-stats-by-turn', 'warband-composition-by-turn'],
// 		// isComputing: false,
// 	} as BgsPostMatchStatsPanel);
// }
// }
