import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ActionsChainParser implements EventParser {
	events: GameEvent[] = [];

	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		if (gameEvent.type === GameEvent.GAME_START || gameEvent.type === GameEvent.GAME_END) {
			this.events = [];
			return currentState;
		}

		this.events.push(gameEvent);
		// console.debug('[debug] actions chain', gameEvent.type, this.events);

		// TODO: build special handlers in each their own class
		const newState = this.handleEventsChain(currentState);
		return newState;
	}

	event(): string {
		return 'ACTIONS_CHAIN';
	}

	private handleEventsChain(currentState: GameState): GameState {
		if (
			this.events[this.events.length - 2]?.type === GameEvent.ENTITY_CHOSEN &&
			this.events[this.events.length - 1].type === GameEvent.SUB_SPELL_START
		) {
			// console.debug('[debug] actions chain processing', this.events);
			const entityChoseEvent = this.events[this.events.length - 2];
			const subSpellStartEvent = this.events[this.events.length - 1];
			const entityChoseCreator = entityChoseEvent.additionalData.context.creatorEntityId;
			const subSpellStartCreator = subSpellStartEvent.additionalData.parentEntityId;
			// We picked right, so we flag the card in the opponent's hand
			if (
				entityChoseCreator === subSpellStartCreator &&
				subSpellStartEvent.additionalData.parentCardId === CardIds.FuturisticForefather_TIME_041
			) {
				let opponentDeck = currentState.opponentDeck;
				opponentDeck = opponentDeck.update({
					additionalKnownCardsInHand: [...opponentDeck.additionalKnownCardsInHand, entityChoseEvent.cardId],
				});
				return currentState.update({
					opponentDeck: opponentDeck,
				});
			}
		}
		return currentState;
	}
}
