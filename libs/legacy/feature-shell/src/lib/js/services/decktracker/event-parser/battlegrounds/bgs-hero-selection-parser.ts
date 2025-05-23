import { isBattlegrounds } from '@firestone-hs/reference-data';
import { BattlegroundsState, BgsHeroSelectionOverviewPanel, BgsPanel, GameState } from '@firestone/game-state';
import { MemoryInspectionService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { ILocalizationService, OwUtilsService } from '@firestone/shared/framework/core';
import { GameStateEvent } from '@legacy-import/src/lib/js/models/decktracker/game-state-event';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { GameEventsEmitterService } from '../../../game-events-emitter.service';
import { EventParser } from '../event-parser';

export class BgsHeroSelectionParser implements EventParser {
	constructor(
		private readonly prefs: PreferencesService,
		private readonly owUtils: OwUtilsService,
		private readonly i18n: ILocalizationService,
		private readonly memoryService: MemoryInspectionService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const options: readonly { cardId: string; entityId: number }[] = gameEvent.additionalData.options;

		const prefs = await this.prefs.getPreferences();
		if (prefs.flashWindowOnYourTurn) {
			this.owUtils.flashWindow();
		}
		console.debug('[bgs-hero-selection] handling event', gameEvent);
		const newHeroSelectionPanel: BgsHeroSelectionOverviewPanel = this.buildHeroSelectionPanel(
			currentState.bgState,
			options,
		);
		console.debug('[bgs-hero-selection] newHeroSelectionPanel', newHeroSelectionPanel);
		const panels: readonly BgsPanel[] = currentState.bgState.panels.map((panel) =>
			panel.id === 'bgs-hero-selection-overview' ? newHeroSelectionPanel : panel,
		);
		return currentState.update({
			bgState: currentState.bgState.update({
				panels: panels,
			}),
		});
	}

	async sideEffects(gameEvent: GameEvent | GameStateEvent, eventsEmitter: GameEventsEmitterService) {
		const bgsInfo = await this.memoryService.getBattlegroundsInfo();
		const newEvent: GameEvent = {
			type: GameEvent.BATTLEGROUNDS_MMR_AT_START,
			additionalData: {
				mmrAtStart: bgsInfo?.Rating,
			},
		} as GameEvent;
		eventsEmitter.allEvents.next(newEvent);
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_HERO_SELECTION;
	}

	private buildHeroSelectionPanel(
		currentState: BattlegroundsState,
		heroOptions: readonly { cardId: string; entityId: number }[],
	): BgsHeroSelectionOverviewPanel {
		return BgsHeroSelectionOverviewPanel.create({
			name: this.i18n.translateString('battlegrounds.menu.hero-selection'),
			heroOptions: heroOptions,
		});
	}
}
