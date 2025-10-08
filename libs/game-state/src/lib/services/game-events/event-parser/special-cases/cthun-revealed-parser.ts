import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../../models/deck-card';
import { DeckState } from '../../../../models/deck-state';
import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';
import { EventParser } from '../_event-parser';
import { DeckManipulationHelper } from './../deck-manipulation-helper';

export class CthunRevealedParser implements EventParser {
	private readonly CTHUN_PIECES = [
		CardIds.CthunTheShattered_BodyOfCthunToken,
		CardIds.CthunTheShattered_EyeOfCthunToken,
		CardIds.CthunTheShattered_HeartOfCthunToken,
		CardIds.CthunTheShattered_MawOfCthunToken,
	];

	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			!!state &&
			gameEvent.additionalData.prefabId === 'DMFFX_SpawnToDeck_CthunTheShattered_CardFromScript_FX' &&
			gameEvent.cardId === CardIds.CthunTheShattered
		);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
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
					entityId: undefined,
					cardName: cardData.name,
					refManaCost: cardData ? cardData.cost : undefined,
					rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : undefined,
					creatorCardId: gameEvent.cardId,
					creatorEntityId: gameEvent.entityId,
				}),
			);
		}
		const newPlayerDeck: DeckState = deck.update({
			deck: deckContents,
		} as DeckState);

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		} as any);
	}

	event(): string {
		return 'CTHUN_SHATTERED_PIECES_REVEAL';
	}
}
