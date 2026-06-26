import { CardIds } from '@firestone-hs/reference-data';
import { getDisplayCardIdWhenGuessedPoolIsSingleCard, DeckCard } from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';

export const TRIANGULATE_ENTITY = 12;
export const CHOSEN_DISCOVER_ENTITY = 126;
export const DRAWN_DECK_ENTITY = 22;
export const SHUFFLED_COPY_ENTITY_IDS = [128, 129, 130] as const;
export const TRIANGULATE_PLAYER_CONTROLLER = 1;

export const BAKING_SODA_CARD_ID = CardIds.BakingSodaVolcano_TOY_500;
export const TRIANGULATE_CARD_ID = CardIds.Triangulate_GDB_451;

/** PowerTaskList block 178 completes SpawnToDeck copies 128–130 + SHUFFLE_DECK for player 1. */
const TRIANGULATE_FIXTURE_END = /PowerTaskList\.DebugDump\(\) - ID=178/;

/**
 * Last game from `test-tools/power.log`, truncated after Triangulate SpawnToDeck + SHUFFLE_DECK.
 */
export function prepareBakingSodaTriangulateFixtureLines(raw: string): readonly string[] {
	const lastGame = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
	const endIdx = lastGame.findIndex((l) => TRIANGULATE_FIXTURE_END.test(l));
	if (endIdx < 0) {
		throw new Error('power.log must contain PowerTaskList ID=178 (Triangulate SpawnToDeck block)');
	}
	return lastGame.slice(0, endIdx + 15);
}

/** Same identity the deck tracker uses when grouping rows (`cardId` or single-card `guessedInfo`). */
export function getEffectiveDeckZoneCardId(card: DeckCard): string | null {
	return card.cardId || getDisplayCardIdWhenGuessedPoolIsSingleCard(card);
}

/**
 * Count in-deck rows displayed as Baking Soda Volcano — matches deck-zone grouping
 * (`effectiveCardId === TOY_500`), including unknown rows with a single-card guess.
 */
export function countBakingSodaVolcanoInDeckAsTracked(deck: { readonly deck: readonly DeckCard[] }): number {
	return deck.deck.filter((c) => getEffectiveDeckZoneCardId(c) === BAKING_SODA_CARD_ID).length;
}

/**
 * Baking Soda Volcano rows the deck tracker shows in "In deck" once Triangulate discover reveals
 * `TOY_500`: three shuffled copies (log entities 128–130) plus the drawn source entity 22 if it
 * incorrectly remains in the deck while also in hand (reported bug: 4 grouped rows, not 3).
 */
export function countBakingSodaVolcanoDeckExposureAfterTriangulate(casterDeck: {
	readonly deck: readonly DeckCard[];
	readonly hand: readonly DeckCard[];
}): number {
	const drawnSourceStillInDeck =
		casterDeck.deck.some((c) => c.entityId === DRAWN_DECK_ENTITY) &&
		casterDeck.hand.some((c) => c.entityId === DRAWN_DECK_ENTITY);
	return SHUFFLED_COPY_ENTITY_IDS.length + (drawnSourceStillInDeck ? 1 : 0);
}

/** Triangulate caster deck from replay state (player 1 = SageSatyr when local is Chmielinho). */
export function triangulateCasterDeckFromReplayState(state: {
	readonly localPlayerId: number;
	readonly playerDeck: { readonly deck: readonly DeckCard[]; readonly hand: readonly DeckCard[] };
	readonly opponentDeck: { readonly deck: readonly DeckCard[]; readonly hand: readonly DeckCard[] };
}) {
	return state.localPlayerId === TRIANGULATE_PLAYER_CONTROLLER ? state.playerDeck : state.opponentDeck;
}

/** Assert fixture anchors for Triangulate → Baking Soda Volcano discover + SpawnToDeck. */
export function assertTriangulateBakingSodaAnchorsFromPowerLogLines(lines: readonly string[]): void {
	const joined = lines.join('\n');
	if (!lines[0]?.includes('CREATE_GAME')) {
		throw new Error('fixture must start with CREATE_GAME');
	}
	if (!joined.includes(`CardID=${TRIANGULATE_CARD_ID}`)) {
		throw new Error(`fixture must contain Triangulate play (${TRIANGULATE_CARD_ID})`);
	}
	if (!joined.includes(`Entities[0]=[entityName=UNKNOWN ENTITY [cardType=INVALID] id=${CHOSEN_DISCOVER_ENTITY}`)) {
		throw new Error(`fixture must contain EntitiesChosen picking entity ${CHOSEN_DISCOVER_ENTITY}`);
	}
	const showChosen = new RegExp(
		`SHOW_ENTITY - Updating Entity=\\[entityName=UNKNOWN ENTITY \\[cardType=INVALID\\] id=${CHOSEN_DISCOVER_ENTITY}[^\\n]*CardID=${BAKING_SODA_CARD_ID}`,
	);
	if (!showChosen.test(joined)) {
		throw new Error(`fixture must SHOW_ENTITY ${CHOSEN_DISCOVER_ENTITY} as ${BAKING_SODA_CARD_ID}`);
	}
	if (!joined.includes(`tag=COPIED_FROM_ENTITY_ID value=${DRAWN_DECK_ENTITY}`)) {
		throw new Error(`fixture must link discover token to deck entity ${DRAWN_DECK_ENTITY}`);
	}
	if (!joined.includes('ReuseFX_Generic_SpawnToDeck_NoFX_CardFromScript_Super')) {
		throw new Error('fixture must contain SpawnToDeck subspell');
	}
	for (const eid of SHUFFLED_COPY_ENTITY_IDS) {
		if (!joined.includes(`id=${eid} zone=DECK`) || !joined.includes(`DISPLAYED_CREATOR value=${TRIANGULATE_ENTITY}`)) {
			throw new Error(`fixture must create deck entity ${eid} with DISPLAYED_CREATOR=${TRIANGULATE_ENTITY}`);
		}
	}
	if (!joined.includes('SHUFFLE_DECK PlayerID=1')) {
		throw new Error('fixture must end with SHUFFLE_DECK for player 1');
	}
}
