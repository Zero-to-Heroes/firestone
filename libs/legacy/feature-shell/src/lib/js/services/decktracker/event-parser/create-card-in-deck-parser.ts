import { CardIds } from '@firestone-hs/reference-data';
import { reverseIfNeeded } from '@legacy-import/src/lib/js/services/decktracker/event-parser/card-dredged-parser';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CreateCardInDeckParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CREATE_CARD_IN_DECK;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = reverseIfNeeded(controllerId === localPlayer.PlayerId, gameEvent.additionalData.creatorCardId);
		// Don't add the cards created by C'Thun, as they are added via the subspell handling
		// There is the risk that, if C'Thun is enchanted and that enchantment creates a card in deck, this
		// hack will discard it. For now it's supposed to be enough of a fringe case to not matter vs
		// properly flagging the cards created by C'Thun
		if (gameEvent.additionalData.creatorCardId === CardIds.CthunTheShattered) {
			return currentState;
		}

		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const cardData = cardId?.length ? this.allCards.getCard(cardId) : null;
		const positionFromBottom = buildPositionFromBottom(
			deck,
			gameEvent.additionalData.creatorCardId ?? gameEvent.additionalData.influencedByCardId,
		);
		// console.debug('[create-card-in-deck]', 'positionFromBottom', positionFromBottom, deck, gameEvent, currentState);
		const createdByJoust = gameEvent.additionalData.createdByJoust;
		const creatorEntityId =
			gameEvent.additionalData.creatorEntityId ?? gameEvent.additionalData.influencedByEntityId
				? +(gameEvent.additionalData.creatorEntityId ?? gameEvent.additionalData.influencedByEntityId)
				: null;
		const creatorEntity = creatorEntityId
			? // Because sometimes the entityId is reversed in the Other zone
			  deck.findCard(creatorEntityId)?.card ?? deck.findCard(-creatorEntityId)?.card
			: null;
		// console.debug(
		// 	'[create-card-in-deck]',
		// 	'creatorEntity',
		// 	creatorEntity,
		// 	gameEvent.additionalData.creatorEntityId,
		// 	gameEvent.additionalData.influencedByEntityId,
		// 	deck,
		// );
		// Because of Tome Tampering
		let { card } = deck.findCard(entityId) ?? { zone: null, card: null };
		// console.debug('[create-card-in-deck]', 'card added', card);
		// Sometimes a CARD_REVEALED event occurs first, so we need to
		const newCardId = cardId ?? card?.cardId;
		card = (card ?? DeckCard.create()).update({
			cardId: newCardId,
			entityId: entityId,
			cardName: this.buildCardName(cardData, gameEvent.additionalData.creatorCardId) ?? card?.cardName,
			manaCost: cardData ? cardData.cost : undefined,
			rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : undefined,
			creatorCardId: gameEvent.additionalData.creatorCardId,
			mainAttributeChange: buildAttributeChange(creatorEntity, newCardId),
			positionFromBottom: positionFromBottom,
			createdByJoust: createdByJoust,
		} as DeckCard);
		// console.debug('[create-card-in-deck]', 'adding card', card);

		const previousDeck = deck.deck;
		const newDeck: readonly DeckCard[] = this.helper.addSingleCardToZone(previousDeck, card);
		const newPlayerDeck = deck.update({
			deck: newDeck,
		});
		// console.debug('[create-card-in-deck]', 'newPlayerDeck', newPlayerDeck);

		if (!card.cardId && !card.entityId) {
			console.warn('Adding unidentified card in deck', card, gameEvent);
		}
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CREATE_CARD_IN_DECK;
	}

	private buildCardName(card: any, creatorCardId: string): string {
		if (card) {
			return this.i18n.getCardName(card.id);
		}
		if (creatorCardId) {
			return this.i18n.getCreatedByCardName(creatorCardId);
		}
		return this.i18n.getUnknownCardName();
	}
}

export const buildPositionFromBottom = (deck: DeckState, creatorCardId: string): number => {
	switch (creatorCardId) {
		// TODO: radar detector
		case CardIds.AmbassadorFaelin_TSC_067:
		case CardIds.AzsharanDefector:
		case CardIds.AzsharanGardens:
		case CardIds.AzsharanMooncatcher_TSC_644:
		case CardIds.AzsharanMooncatcher_Story_11_AzsharanMoonPuzzle:
		case CardIds.AzsharanRitual:
		case CardIds.AzsharanSaber:
		case CardIds.AzsharanScavenger:
		case CardIds.AzsharanScroll:
		case CardIds.AzsharanSentinel:
		case CardIds.AzsharanSweeper_TSC_776:
		case CardIds.AzsharanSweeper_Story_11_AzsharanSweeper:
		case CardIds.AzsharanTrident:
		case CardIds.AzsharanVessel:
		case CardIds.BootstrapSunkeneer: // TODO: not sure this belongs here in this parser
		case CardIds.Bottomfeeder:
			return DeckCard.deckIndexFromBottom++;
	}
	return undefined;
};

const buildAttributeChange = (creatorCard: DeckCard, newCardId: string): number => {
	// console.debug('building attribute change', card);
	// If the card is played by an effect (eg Manaling), it's possible that the creatorCard
	// doesn't have the correct id
	if (creatorCard?.cardId === CardIds.Ignite || newCardId === CardIds.Ignite) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	if (creatorCard?.cardId === CardIds.Bottomfeeder || newCardId === CardIds.Bottomfeeder) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	if (creatorCard?.cardId === CardIds.SunscaleRaptor || newCardId === CardIds.SunscaleRaptor) {
		return 1 + (creatorCard.mainAttributeChange ?? 0);
	}
	return null;
};
