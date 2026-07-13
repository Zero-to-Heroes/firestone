/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Godfreythe Betrayer (JAIL_509)
 * Start of Game: Overdrawn cards return to your hand when you have space. They cost (1) less.
 */
import { CardIds, GameTag } from '@firestone-hs/reference-data';

import { ParserGameStateLite } from '@firestone/power-log-parser';
import { DeckCard } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const GodfreytheBetrayer: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.GodfreytheBetrayer_JAIL_509, CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const godfreyCards = buildGofreyCards(input.inputOptions.deckState, input.inputOptions.gameState.parserState);
		return godfreyCards.map((c) => c.cardId);
	},
	guessInfo: (input: GuessInfoInput) => {
		const godfreyCards = buildGofreyCards(input.deckState, input.gameState.parserState);
		return {
			possibleCards: godfreyCards.map((c) => c.cardId),
		};
	},
};

export const buildGofreyCards = (deckState: DeckState, parserState: ParserGameStateLite | undefined) => {
	const allBurned = deckState.burnedCards;
	const returnedCards = deckState
		.getAllCardsInDeckWithoutOptions()
		.filter((c) => c.creatorCardId === CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e);
	const originalReturnedEntityIds = returnedCards.map(
		(r) =>
			parserState?.CurrentEntities?.get(r.entityId)?.Tags?.find((t) => t.Name === GameTag.COPIED_FROM_ENTITY_ID)
				?.Value,
	);
	const godfreyCards: readonly DeckCard[] = allBurned
		// Remove returned
		.filter((c) => !originalReturnedEntityIds.includes(c.entityId))
		.map((c) => deckState.findCard(c.entityId)?.card)
		.filter((c) => !!c);
	return godfreyCards;
};
