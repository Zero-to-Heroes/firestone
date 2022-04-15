import { CardIds } from '@firestone-hs/reference-data';
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

		const isPlayer = controllerId === localPlayer.PlayerId;
		// Don't add the cards created by C'Thun, as they are added via the subspell handling
		// There is the risk that, if C'Thun is enchanted and that enchantment creates a card in deck, this
		// hack will discard it. For now it's supposed to be enough of a fringe case to not matter vs
		// properly flagging the cards created by C'Thun
		if (gameEvent.additionalData.creatorCardId === CardIds.CthunTheShattered) {
			return currentState;
		}

		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const cardData = cardId?.length ? this.allCards.getCard(cardId) : null;
		const positionFromBottom = buildPositionFromBottom(deck, gameEvent.additionalData.creatorCardId);
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: this.buildCardName(cardData, gameEvent.additionalData.creatorCardId),
			manaCost: cardData ? cardData.cost : undefined,
			rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : undefined,
			creatorCardId: gameEvent.additionalData.creatorCardId,
			mainAttributeChange: gameEvent.additionalData.creatorEntityId
				? buildAttributeChange(deck.findCard(gameEvent.additionalData.creatorEntityId))
				: null,
			positionFromBottom: positionFromBottom,
		} as DeckCard);
		//console.debug('[debug]', 'adding card', card);

		const previousDeck = deck.deck;
		const newDeck: readonly DeckCard[] = this.helper.addSingleCardToZone(previousDeck, card);
		const newPlayerDeck = deck.update({
			deck: newDeck,
		});
		//console.debug('[debug]', 'newPlayerDeck', newPlayerDeck);

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
		case CardIds.AmbassadorFaelin1:
		case CardIds.AzsharanDefector:
		case CardIds.AzsharanGardens:
		case CardIds.AzsharanMooncatcher:
		case CardIds.AzsharanRitual:
		case CardIds.AzsharanSaber:
		case CardIds.AzsharanScavenger:
		case CardIds.AzsharanScroll:
		case CardIds.AzsharanSentinel:
		case CardIds.AzsharanSweeper:
		case CardIds.AzsharanTrident:
		case CardIds.AzsharanVessel:
		case CardIds.BootstrapSunkeneer: // TODO: not sure this belongs here in this parser
		case CardIds.Bottomfeeder:
			// TODO: dredge
			// TODO: radar detector
			// So that it gets bumped to 1 in the later cleaning phase, and 0 is always free
			return 0;
	}
	return undefined;
};

const buildAttributeChange = (card: DeckCard): number => {
	if (card?.cardId === CardIds.Ignite) {
		return 1 + (card.mainAttributeChange ?? 0);
	}
	if (card?.cardId === CardIds.Bottomfeeder) {
		return 2 + (card.mainAttributeChange ?? 0);
	}
	return null;
};
