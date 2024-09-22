import { BattlegroundsState, BgsGame, BgsHeroSelectionOverviewPanel, BgsPanel } from '@firestone/battlegrounds/core';
import { MemoryInspectionService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { OwUtilsService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsHeroSelectionEvent } from '../events/bgs-hero-selection-event';
import { EventParser } from './_event-parser';
import { BgsGlobalInfoUpdatedParser } from './bgs-global-info-updated-parser';

export class BgsHeroSelectionParser implements EventParser {
	constructor(
		private readonly memoryService: MemoryInspectionService,
		private readonly owUtils: OwUtilsService,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroSelectionEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsHeroSelectionEvent): Promise<BattlegroundsState> {
		const prefs = await this.prefs.getPreferences();
		if (prefs.flashWindowOnYourTurn) {
			this.owUtils.flashWindow();
		}
		const bgsInfo = await this.memoryService.getBattlegroundsInfo(10);
		console.log('[bgs-game-init] retrieved bgs info', bgsInfo?.Game?.AvailableRaces);
		const [availableRaces, bannedRaces] = BgsGlobalInfoUpdatedParser.buildRaces(bgsInfo?.Game?.AvailableRaces);
		const newHeroSelectionPanel: BgsHeroSelectionOverviewPanel = await this.buildHeroSelectionPanel(
			currentState,
			event.heroCardIds,
		);
		const panels: readonly BgsPanel[] = currentState.panels.map((panel) =>
			panel.id === 'bgs-hero-selection-overview' ? newHeroSelectionPanel : panel,
		);
		return currentState.update({
			currentPanelId: 'bgs-hero-selection-overview',
			panels: panels,
			inGame: true,
			currentGame: currentState.currentGame.update({
				availableRaces: availableRaces,
				bannedRaces: bannedRaces,
			} as BgsGame),
		} as BattlegroundsState);
	}

	private async buildHeroSelectionPanel(
		currentState: BattlegroundsState,
		heroCardIds: readonly string[],
	): Promise<BgsHeroSelectionOverviewPanel> {
		return BgsHeroSelectionOverviewPanel.create({
			name: this.i18n.translateString('battlegrounds.menu.hero-selection'),
			heroOptionCardIds: heroCardIds,
		} as BgsHeroSelectionOverviewPanel);
	}
}
