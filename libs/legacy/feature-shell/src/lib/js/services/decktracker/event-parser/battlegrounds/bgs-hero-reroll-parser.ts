import { BgsHeroSelectionOverviewPanel, BgsPanel, GameState } from '@firestone/game-state';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsHeroRerollParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.debug('[bgs-hero-reroll] handling event', event);
		const entityId = gameEvent.entityId;
		const cardId = gameEvent.cardId;
		const heroSelectionPanel = currentState.bgState.panels.find(
			(p) => p.id === 'bgs-hero-selection-overview',
		) as BgsHeroSelectionOverviewPanel;
		const newHeroesOffered = heroSelectionPanel.heroOptions.map((hero) =>
			hero.entityId === entityId ? { ...hero, cardId: cardId } : hero,
		);
		const newPanel = heroSelectionPanel.update({
			heroOptions: newHeroesOffered,
		});
		console.debug('[bgs-hero-reroll] newHeroSelectionPanel', newPanel);
		const panels: readonly BgsPanel[] = currentState.bgState.panels.map((panel) =>
			panel.id === 'bgs-hero-selection-overview' ? newPanel : panel,
		);
		return currentState.update({
			bgState: currentState.bgState.update({
				panels: panels,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_HERO_REROLL;
	}
}
