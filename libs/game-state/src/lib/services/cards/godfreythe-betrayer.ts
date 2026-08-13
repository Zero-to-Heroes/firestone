/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Godfreythe Betrayer (JAIL_509)
 * Start of Game: Overdrawn cards return to your hand when you have space. They cost (1) less.
 */
import { CardIds, GameTag, Zone } from '@firestone-hs/reference-data';

import { ParserGameStateLite } from '@firestone/power-log-parser';
import { DeckCard } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { getTag, getEntityTags } from '../parser-entity-utils';
import {
	GeneratingCard,
	GuessCardIdInput,
	GuessInfoInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';

const ATLAS_CARD_ID = CardIds.GodfreyTheBetrayer_GodfreysAtlasEnchantment_JAIL_509e;

export const GodfreytheBetrayer: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.GodfreytheBetrayer_JAIL_509, ATLAS_CARD_ID],
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
	// Force to null to avoid info leaks
	guessCardId: (input: GuessCardIdInput) => {
		return null;
	},
};

export interface GodfreyQueuedCard {
	readonly cardId: string;
	readonly entityId: number;
	readonly returned: boolean;
}

/**
 * Atlas history copies stamp COPIED_FROM on the blank return token (not the burned original).
 * A queued card has been returned when that token leaves SETASIDE (HAND / PLAY / GRAVEYARD).
 */
export const listGodfreyQueuedCards = (
	deckState: DeckState,
	parserState: ParserGameStateLite | undefined,
): readonly GodfreyQueuedCard[] => {
	const returnedCardIds = [...getReturnedGodfreyCardIds(deckState, parserState)];
	return deckState.burnedCards.map((c) => {
		const idx = returnedCardIds.indexOf(c.cardId);
		if (idx >= 0) {
			returnedCardIds.splice(idx, 1);
			return { cardId: c.cardId, entityId: c.entityId, returned: true };
		}
		return { cardId: c.cardId, entityId: c.entityId, returned: false };
	});
};

export const buildGofreyCards = (deckState: DeckState, parserState: ParserGameStateLite | undefined) => {
	const godfreyCards: readonly DeckCard[] = listGodfreyQueuedCards(deckState, parserState)
		.filter((c) => !c.returned)
		.map((c) => deckState.findCard(c.entityId)?.card)
		.filter((c) => !!c);
	return godfreyCards;
};

function getReturnedGodfreyCardIds(
	deckState: DeckState,
	parserState: ParserGameStateLite | undefined,
): readonly string[] {
	const returnedTokenIds = new Set(
		deckState
			.getAllCardsInDeckWithoutOptions()
			.filter((c) => c.creatorCardId === ATLAS_CARD_ID)
			.map((c) => c.entityId)
			.filter((id): id is number => id != null),
	);
	const entities = parserState?.CurrentEntities;
	if (!entities?.size) {
		return [];
	}

	const atlasEntityIds = new Set<number>();
	for (const [id, entity] of entities) {
		if (entity.CardId === ATLAS_CARD_ID) {
			atlasEntityIds.add(id);
		}
	}
	if (atlasEntityIds.size === 0) {
		return [];
	}

	const returnedCardIds: string[] = [];
	for (const entity of entities.values()) {
		const creatorId = readTag(entity, GameTag.CREATOR);
		if (!atlasEntityIds.has(creatorId)) {
			continue;
		}
		const copiedFrom = readTag(entity, GameTag.COPIED_FROM_ENTITY_ID);
		if (copiedFrom <= 0) {
			continue;
		}
		if (!isGodfreyReturnTokenReturned(copiedFrom, returnedTokenIds, entities)) {
			continue;
		}
		if (entity.CardId) {
			returnedCardIds.push(entity.CardId);
		}
	}
	return returnedCardIds;
}

function isGodfreyReturnTokenReturned(
	tokenId: number,
	returnedTokenIds: ReadonlySet<number>,
	entities: Map<number, { CardId?: string; Tags?: readonly { Name: number; Value: number }[] | null }>,
): boolean {
	if (returnedTokenIds.has(tokenId)) {
		return true;
	}
	const token = entities.get(tokenId);
	const zone = readTag(token, GameTag.ZONE);
	return zone !== -1 && zone !== (Zone.SETASIDE as number);
}

function readTag(
	entity: { Tags?: readonly { Name: number; Value: number }[] | null } | undefined,
	tag: GameTag,
): number {
	return getTag(getEntityTags(entity), tag);
}
