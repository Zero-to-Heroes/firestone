import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CthunRevealedParser implements EventParser {
	private readonly CTHUN_PIECES = [
		CardIds.CthunTheShattered_BodyOfCthunToken,
		CardIds.CthunTheShattered_EyeOfCthunToken,
		CardIds.CthunTheShattered_HeartOfCthunToken,
		CardIds.CthunTheShattered_MawOfCthunToken,
	];

	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			state &&
			state.opponentDeck &&
			gameEvent.type === GameEvent.SUB_SPELL_START &&
			gameEvent.additionalData.prefabId === 'DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX' &&
			gameEvent.cardId === CardIds.CthunTheShattered
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// console.debug('handling CThun revealed', gameEvent);
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		let deckContents = deck.deck;
		// Manually add the 4 C'Thun pieces
		for (const cardId of this.CTHUN_PIECES) {
			const cardData = this.allCards.getCard(cardId);
			deckContents = this.helper.addSingleCardToZone(
				deckContents,
				DeckCard.create({
					cardId: cardId,
					entityId: null,
					cardName: cardData.name,
					manaCost: cardData ? cardData.cost : undefined,
					rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : undefined,
					creatorCardId: gameEvent.cardId,
				} as DeckCard),
			);
			// console.debug('added to deck', cardId, deckContents);
		}
		const newPlayerDeck: DeckState = deck.update({
			deck: deckContents,
		} as DeckState);
		// console.debug('[cthun revealed] newPlayerDeck', newPlayerDeck);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		} as any);
	}

	event(): string {
		return 'CTHUN_SHATTERED_PIECES_REVEAL';
	}
}
