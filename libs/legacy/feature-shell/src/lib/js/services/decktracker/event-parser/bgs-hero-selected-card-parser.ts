import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class BgsHeroSelectedCardParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);

		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(deck.hand, card.cardId, entityId);

		// See card-played-from-hand
		const newDeck = this.helper.updateDeckForAi(gameEvent, currentState, removedCard);

		const cardWithZone = card.update({
			zone: 'SETASIDE',
		} as DeckCard);
		const newOther: readonly DeckCard[] = this.helper.addSingleCardToZone(deck.otherZone, cardWithZone);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			otherZone: newOther,
			deck: newDeck,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_HERO_SELECTED;
	}
}
