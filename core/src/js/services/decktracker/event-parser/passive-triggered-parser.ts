import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { modifyDeckForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class PassiveTriggeredParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.PASSIVE_BUFF;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!cardId) {
			console.log('no cardId for passive');
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardData = cardId ? this.allCards.getCard(cardId) : null;
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: cardData && cardData.name,
			manaCost: cardData && cardData.cost,
			rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : null,
		} as DeckCard);

		const newGlobalEffects: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.globalEffects, card);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			globalEffects: newGlobalEffects,
		});

		const deckAfterSpecialCaseUpdate: DeckState = modifyDeckForSpecialCards(cardId, newPlayerDeck, this.allCards);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deckAfterSpecialCaseUpdate,
		});
	}

	event(): string {
		return GameEvent.PASSIVE_BUFF;
	}
}
