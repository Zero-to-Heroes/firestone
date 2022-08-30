import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';
import { addAdditionalAttribues } from './receive-card-in-hand-parser';

export class DataScriptChangedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.DATA_SCRIPT_CHANGED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		console.debug('[data-script-changed] handling event', cardId, entityId, gameEvent, currentState);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = deck.hand.find((c) => c.entityId === entityId);
		if (!cardInHand) {
			// console.warn('[data-script-changed] no card', gameEvent, deck.hand);
			return currentState;
		}

		const cardWithAdditionalAttributes = addAdditionalAttribues(cardInHand, deck, gameEvent, this.allCards);
		console.debug('[data-script-changed] cardWithAdditionalAttributes', cardWithAdditionalAttributes, cardInHand);
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = this.helper.replaceCardInZone(previousHand, cardWithAdditionalAttributes);
		console.debug('[data-script-changed] new hand', newHand);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			abyssalCurseHighestValue:
				cardWithAdditionalAttributes.cardId === CardIds.SirakessCultist_AbyssalCurseToken
					? Math.max(
							deck.abyssalCurseHighestValue ?? 0,
							// When you are the active player, it's possible that the info comes from the FULL_ENTITY node itself,
							// while it is in the ENTITY_UPDATE event for the opponent
							!!gameEvent.additionalData.dataNum1 && gameEvent.additionalData.dataNum1 !== -1
								? gameEvent.additionalData.dataNum1
								: cardWithAdditionalAttributes.mainAttributeChange + 1,
					  )
					: deck.abyssalCurseHighestValue,
		} as DeckState);
		console.debug('[data-script-changed] deckState', newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.DATA_SCRIPT_CHANGED;
	}
}
