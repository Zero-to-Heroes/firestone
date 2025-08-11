import { DeckDefinition, decode, encode } from '@firestone-hs/deckstrings';
import { CardsFacadeService } from '@firestone/shared/framework/core';

export const sanitizeDeckstring = (
	deckstring: string | null | undefined,
	allCards: CardsFacadeService,
): string | null => {
	if (!deckstring?.length) {
		return null;
	}
	const deckDefinition = decode(deckstring);
	const updatedDeckDefinition = sanitizeDeckDefinition(deckDefinition, allCards);
	return encode(updatedDeckDefinition);
};

export const sanitizeDeckDefinition = (
	deckDefinition: DeckDefinition,
	allCards: CardsFacadeService,
): DeckDefinition => {
	return deckDefinition;
};

