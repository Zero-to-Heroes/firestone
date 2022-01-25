import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardBackToDeckParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_BACK_TO_DECK;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const initialZone: string = gameEvent.additionalData.initialZone;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.findCard(initialZone, deck, cardId, entityId);

		const newHand: readonly DeckCard[] = this.buildNewHand(initialZone, deck.hand, card);
		const newBoard: readonly DeckCard[] = this.buildNewBoard(initialZone, deck.board, card);
		const newOther: readonly DeckCard[] = this.buildNewOther(initialZone, deck.otherZone, card);
		const previousDeck = deck.deck;
		// When we have a deckstring / decklist, we show all the possible remaining options in the
		// decklist. This means that when a filler card goes back, it's one of these initial cards
		// that goes back, and so we don't add them once again
		const shouldKeepDeckAsIs = deck.deckstring && card?.inInitialDeck && !card?.cardId;

		// This is to avoid the scenario where a card is drawn by a public influence (eg Thistle Tea) and
		// put back in the deck, then drawn again. If we don't reset the lastInfluencedBy, we
		// could possibly have an info leak
		const cardWithoutInfluence = card
			? card.update({
					lastAffectedByCardId: undefined,
			  } as DeckCard)
			: card;
		const newDeck: readonly DeckCard[] = shouldKeepDeckAsIs
			? previousDeck
			: this.helper.addSingleCardToZone(previousDeck, cardWithoutInfluence);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			deck: newDeck,
			hand: newHand,
			board: newBoard,
			otherZone: newOther,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_BACK_TO_DECK;
	}

	private findCard(initialZone: string, deckState: DeckState, cardId: string, entityId: number): DeckCard {
		let result = null;
		if (initialZone === 'HAND') {
			result = this.helper.findCardInZone(deckState.hand, cardId, entityId);
		} else if (initialZone === 'PLAY') {
			result = this.helper.findCardInZone(deckState.board, cardId, entityId);
		} else if (['GRAVEYARD', 'REMOVEDFROMGAME', 'SETASIDE', 'SECRET'].indexOf(initialZone) !== -1) {
			result = this.helper.findCardInZone(deckState.otherZone, cardId, entityId);
		}
		// console.warn('could not find card in card-back-to-deck', initialZone, cardId, deckState);
		const dbCard = (cardId && this.allCards.getCard(cardId)) || ({} as ReferenceCard);
		return (
			result ??
			DeckCard.create({
				cardId: cardId,
				entityId: entityId,
				cardName: this.i18n.getCardName(dbCard.id),
				manaCost: dbCard.cost,
				rarity: dbCard.rarity ? dbCard.rarity.toLowerCase() : null,
				playTiming: null,
			} as DeckCard)
		);
	}

	private buildNewHand(
		initialZone: string,
		previousHand: readonly DeckCard[],
		movedCard: DeckCard,
	): readonly DeckCard[] {
		if (initialZone !== 'HAND' || !movedCard) {
			return previousHand;
		}
		return this.helper.removeSingleCardFromZone(previousHand, movedCard.cardId, movedCard.entityId)[0];
	}

	private buildNewOther(
		initialZone: string,
		previousOther: readonly DeckCard[],
		movedCard: DeckCard,
	): readonly DeckCard[] {
		if (['GRAVEYARD', 'REMOVEDFROMGAME', 'SETASIDE', 'SECRET'].indexOf(initialZone) !== -1 || !movedCard) {
			return this.helper.removeSingleCardFromZone(previousOther, movedCard.cardId, movedCard.entityId)[0];
		}
		return previousOther;
	}

	private buildNewBoard(
		initialZone: string,
		previousBOard: readonly DeckCard[],
		movedCard: DeckCard,
	): readonly DeckCard[] {
		if (initialZone !== 'PLAY' || !movedCard) {
			return previousBOard;
		}
		return this.helper.removeSingleCardFromZone(previousBOard, movedCard.cardId, movedCard.entityId)[0];
	}
}
