/**
 * Lady Liadrin (BT_334) / Lady Liadrin Core (CORE_BT_334)
 * Battlecry: Add a copy of each spell you cast on friendly characters this game to your hand.
 *
 * Copies are added in random order when multiple different spells qualify; we only narrow to a
 * single card id when every qualifying cast is the same spell (including several casts of it).
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { DeckState } from '../../models/deck-state';
import { GuessedInfo } from '../../models/deck-card';
import {
	GeneratingCard,
	GuessCardIdInput,
	GuessInfoInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';

const LIADRIN_IDS = [CardIds.LadyLiadrin, CardIds.LadyLiadrin_CORE_BT_334] as const;

/** One entry per friendly-target cast, in chronological order; duplicates allowed. */
function friendlySpellCardIdsInOrder(deckState: DeckState): string[] {
	const out: string[] = [];
	for (const s of deckState.spellsPlayedOnFriendlyEntities ?? []) {
		const id = s.cardId;
		if (id?.length) {
			out.push(id);
		}
	}
	return out;
}

/**
 * When several different spells were cast on friendlies, Liadrin adds one copy of each in random
 * order — we must not guess a specific id from createdIndex. When every qualifying cast is the same
 * spell, each copy is that spell. Narrowing to a concrete id is only applied for the opponent deck
 * (cards created in the opponent's hand); your own Liadrin gifts still use the pool alone.
 */
function guessCardIdWhenUnambiguous(
	deckState: DeckState,
	spells: readonly { cardId?: string | null }[],
): string | null {
	if (!deckState.isOpponent) {
		return null;
	}
	const ids = spells.map((s) => s.cardId).filter((id): id is string => !!id?.length);
	if (!ids.length) {
		return null;
	}
	const distinct = new Set(ids);
	if (distinct.size !== 1) {
		return null;
	}
	return ids[0]!;
}

export const LadyLiadrin: GeneratingCard & StaticGeneratingCard = {
	cardIds: [...LIADRIN_IDS],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = friendlySpellCardIdsInOrder(input.deckState);
		return {
			cardType: CardType.SPELL,
			possibleCards,
		};
	},
	guessCardId: (input: GuessCardIdInput): string | null => {
		return guessCardIdWhenUnambiguous(
			input.deckState,
			input.deckState.spellsPlayedOnFriendlyEntities ?? [],
		);
	},
	dynamicPool: (input: StaticGeneratingCardInput) => friendlySpellCardIdsInOrder(input.inputOptions.deckState),
};
