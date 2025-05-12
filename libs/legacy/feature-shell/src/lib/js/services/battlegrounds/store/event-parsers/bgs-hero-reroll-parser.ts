import { BattlegroundsState, BgsHeroSelectionOverviewPanel, BgsPanel } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsHeroRerollEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsHeroRerollEvent' as const;
	constructor(public readonly entityId: number, public readonly cardId: string) {
		super('BgsHeroRerollEvent');
	}
}

export class BgsHeroRerollParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsHeroRerollEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsHeroRerollEvent): Promise<BattlegroundsState> {
		console.debug('[bgs-hero-reroll] handling event', event);
		const heroSelectionPanel = currentState.panels.find(
			(p) => p.id === 'bgs-hero-selection-overview',
		) as BgsHeroSelectionOverviewPanel;
		const newHeroesOffered = heroSelectionPanel.heroOptions.map((hero) =>
			hero.entityId === event.entityId ? { ...hero, cardId: event.cardId } : hero,
		);
		const newPanel = heroSelectionPanel.update({
			heroOptions: newHeroesOffered,
		});
		console.debug('[bgs-hero-reroll] newHeroSelectionPanel', newPanel);
		const panels: readonly BgsPanel[] = currentState.panels.map((panel) =>
			panel.id === 'bgs-hero-selection-overview' ? newPanel : panel,
		);
		return currentState.update({
			panels: panels,
		});
	}
}
