import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { globalEffectCards } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { modifyDeckForSpecialCardEffects } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class StartOfGameEffectParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const refCard = this.allCards.getCard(cardId);
		const card = DeckCard.create({
			entityId: entityId, // We need the entityId to know if the same effect is registered multiple times
			cardId: cardId,
			cardName: refCard.name,
			refManaCost: refCard?.cost,
			rarity: refCard?.rarity?.toLowerCase(),
			zone: null,
		} as DeckCard);
		const newGlobalEffects = globalEffectCards.includes(gameEvent.cardId as CardIds)
			? this.helper.addSingleCardToZone(deck.globalEffects, card)
			: deck.globalEffects;
		let newDeckContents = deck.deck;
		// we want to be able to add multiple copies of the same "start of combat" card, but we don't want to add
		// a card if we already know it's in the list
		// This happens when we have multiple Prince Malchezaar cards in the deck, for instance
		if (!deck.deckList?.length && !deck.deckstring && !deck.deck.some((e) => e.entityId === entityId)) {
			const fillerCard = deck.deck.find(
				(card) => !card.entityId && !card.cardId && !card.cardName && !card.creatorCardId,
			);
			newDeckContents = newDeckContents.filter((e) => e !== fillerCard);
			newDeckContents = this.helper.addSingleCardToZone(newDeckContents, card);
			// newDeckContents = this.helper.empiricReplaceCardInZone(deck.deck, card, true);
		}
		const newDeckState: DeckState = deck.update({
			globalEffects: newGlobalEffects,
			deck: newDeckContents,
		} as DeckState);
		const deckAfterSpecialCaseUpdate: DeckState = modifyDeckForSpecialCardEffects(
			cardId,
			newDeckState,
			this.allCards,
			this.i18n,
		);
		console.debug('[debug] start of game effect parser', cardId, isPlayer, deckAfterSpecialCaseUpdate);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deckAfterSpecialCaseUpdate,
		} as any);
	}

	event(): string {
		return 'StartOfGameEffectParser';
	}
}
