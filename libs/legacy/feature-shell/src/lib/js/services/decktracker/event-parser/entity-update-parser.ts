import { CardIds } from '@firestone-hs/reference-data';
import { publicCardCreators } from '@services/hs-utils';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { CardsFacadeService } from '../../cards-facade.service';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';
import { addAdditionalAttribues } from './receive-card-in-hand-parser';

export class EntityUpdateParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.ENTITY_UPDATE;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = this.helper.findCardInZone(deck.hand, null, entityId);
		const cardInDeck = this.helper.findCardInZone(deck.deck, null, entityId);
		const cardInOther = this.helper.findCardInZone(deck.otherZone, null, entityId);

		// Some cards discovered by the opponent from their deck leak info in the logs
		// This will probably cause some existing info to disappear, and will have to be removed once the logs are fixed
		const obfsucatedCardId =
			!isPlayer && cardInOther && !cardInOther.cardId && !gameEvent.additionalData?.revealed ? null : cardId;
		// console.debug('[entity-update] cardInOther', cardInOther);

		const shouldShowCardIdInHand =
			// If we don't restrict it to the current player, we create some info leaks in the opponent's hand (eg with Baku)
			cardInHand &&
			// I Don't know why this was introduced. Keeping this prevents some cards to be updated when we do get some
			// additional information about the card, like for Abyssal Curses
			// cardInHand.cardId !== cardId &&
			// Introduced for Lorewalker Cho
			(isPlayer || publicCardCreators.includes(cardInHand.creatorCardId as CardIds));

		const newCardInHand = shouldShowCardIdInHand
			? addAdditionalAttribues(
					cardInHand.update({
						cardId: obfsucatedCardId,
						cardName: this.i18n.getCardName(obfsucatedCardId),
					} as DeckCard),
					deck,
					gameEvent,
					this.allCards,
			  )
			: null;
		// console.debug('[entity-update] newCardInHand', newCardInHand, shouldShowCardIdInHand, cardInHand, gameEvent);

		const newCardInDeck =
			cardInDeck && cardInDeck.cardId !== obfsucatedCardId
				? cardInDeck.update({
						cardId: obfsucatedCardId,
						cardName: this.i18n.getCardName(obfsucatedCardId),
				  } as DeckCard)
				: null;
		// console.debug('[entity-update] newCardInDeck', newCardInDeck);
		const newCardInOther =
			cardInOther && cardInOther.cardId !== obfsucatedCardId
				? cardInOther.update({
						cardId: obfsucatedCardId,
						cardName: this.i18n.getCardName(obfsucatedCardId),
				  } as DeckCard)
				: null;

		const newHand = newCardInHand ? this.helper.replaceCardInZone(deck.hand, newCardInHand) : deck.hand;

		const newDeck = newCardInDeck ? this.helper.replaceCardInZone(deck.deck, newCardInDeck) : deck.deck;
		const newOther = newCardInOther
			? this.helper.replaceCardInZone(deck.otherZone, newCardInOther)
			: deck.otherZone;

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			deck: newDeck,
			otherZone: newOther,
			abyssalCurseHighestValue:
				newCardInHand?.cardId === CardIds.SirakessCultist_AbyssalCurseToken
					? Math.max(deck.abyssalCurseHighestValue ?? 0, gameEvent.additionalData.dataNum1 ?? 0)
					: deck.abyssalCurseHighestValue,
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.ENTITY_UPDATE;
	}
}
