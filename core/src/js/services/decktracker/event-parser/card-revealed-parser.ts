import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRevealedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly cards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_REVEALED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// const creatorCardId = gameEvent.additionalData.creatorCardId;

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = this.cards.getCard(cardId, false) ?? ({} as ReferenceCard);
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: dbCard.name,
			manaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'SETASIDE',
			temporaryCard: true,
			// lastAffectedByCardId: creatorCardId,
		} as DeckCard);
		// console.debug('card revealed', card);

		const newOther: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.otherZone, card);
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
