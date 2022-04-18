import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRevealedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_REVEALED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// const creatorCardId = gameEvent.additionalData.creatorCardId;
		// For some reason, during a reconnect, the logs contain the full list of all cards
		// in our deck and puts them in the SETASIDE zone.
		if (currentState.reconnectOngoing) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = this.cards.getCard(cardId, false) ?? ({} as ReferenceCard);
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: this.i18n.getCardName(dbCard.id, dbCard.name),
			manaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'SETASIDE',
			temporaryCard: true,
			lastAffectedByCardId: gameEvent.additionalData.creatorCardId,
			positionFromBottom:
				gameEvent.additionalData.revealedFromBlock === 'DREDGE'
					? DeckCard.deckIndexFromBottom + 3 - gameEvent.additionalData.indexInBlock
					: undefined,
		} as DeckCard);
		//console.debug('[debug]', 'card revealed', card, DeckCard.deckIndexFromBottom, gameEvent);

		// Simply adding the card to the zone doesn't work if the card already exist (eg we have put a card at the
		// bottom of the deck with another card previously)
		const newOther: readonly DeckCard[] = this.helper.empiricReplaceCardInZone(deck.otherZone, card, false);
		//console.debug('[debug]', 'newOther', newOther);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			otherZone: newOther,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_REVEALED;
	}
}
