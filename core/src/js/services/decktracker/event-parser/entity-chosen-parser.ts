import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const CARDS_THAT_PUT_ON_TOP = [CardIds.SightlessWatcherCore, CardIds.SightlessWatcherLegacy];

export class EntityChosenParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ENTITY_CHOSEN;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		console.debug('[entity-chosen]', cardId, controllerId, localPlayer, entityId, gameEvent);

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const originCreatorCardId = gameEvent.additionalData?.context?.creatorCardId;
		if (!CARDS_THAT_PUT_ON_TOP.includes(originCreatorCardId)) {
			console.debug('[entity-chosen] not implemented', originCreatorCardId);
			return currentState;
		}

		const cardInDeck = this.helper.findCardInZone(deck.deck, cardId, gameEvent.additionalData?.originalEntityId);
		if (!cardInDeck) {
			console.debug(
				'[entity-chosen] card not found in deck',
				cardId,
				gameEvent.additionalData?.originalEntityId,
				deck.deck,
			);
			return currentState;
		}

		const newCard = cardInDeck.update({
			positionFromTop: 0,
		});

		const newDeck: readonly DeckCard[] = this.helper.empiricReplaceCardInZone(
			deck.deck,
			newCard,
			deck.deckList.length === 0,
		);

		const newPlayerDeck = deck.update({
			deck: newDeck,
		});

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.ENTITY_UPDATE;
	}
}
