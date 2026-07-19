import { CardIds, GameTag } from '@firestone-hs/reference-data';

import { Mutable } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { addAdditionalAttribuesInHand } from './receive-card-in-hand-parser';

/**
 * Merged DATA_SCRIPT_CHANGED events can carry hundreds of updates (e.g. Beetle Army in BG),
 * and `otherZone` grows unboundedly there. Per-update `DeckState.findCard` linear scans made
 * this parser the single biggest game-state CPU cost on long BG games (~65% of the total),
 * so each deck's zones are indexed ONCE per merged event instead: O(cards + updates) rather
 * than O(cards x updates).
 */
type DeckZoneId = 'hand' | 'deck' | 'board' | 'other';

interface DeckDataScriptIndex {
	/** Mirrors `DeckState.findCard`: abs(entityId) match, zone priority hand > deck > board > other. */
	readonly byAbsEntityId: Map<number, { zone: DeckZoneId; card: DeckCard }>;
	/** Mirrors `deck.hand.find((c) => c.entityId === entityId)` (exact match, first wins). */
	readonly handByEntityId: Map<number, DeckCard>;
	/** Mirrors `deck.enchantments.find((e) => e.entityId === entityId)`. */
	readonly enchantmentsByEntityId: Map<number, DeckState['enchantments'][number]>;
}

const buildDeckIndex = (deck: DeckState): DeckDataScriptIndex => {
	const byAbsEntityId = new Map<number, { zone: DeckZoneId; card: DeckCard }>();
	const zones: [DeckZoneId, readonly DeckCard[]][] = [
		['hand', deck.hand],
		['deck', deck.deck],
		['board', deck.board],
		['other', deck.otherZone],
	];
	for (const [zone, cards] of zones) {
		for (const card of cards) {
			if (card.entityId == null) {
				continue;
			}
			const key = Math.abs(card.entityId);
			if (!byAbsEntityId.has(key)) {
				byAbsEntityId.set(key, { zone, card });
			}
		}
	}
	const handByEntityId = new Map<number, DeckCard>();
	for (const card of deck.hand) {
		if (card.entityId != null && !handByEntityId.has(card.entityId)) {
			handByEntityId.set(card.entityId, card);
		}
	}
	const enchantmentsByEntityId = new Map<number, DeckState['enchantments'][number]>();
	for (const enchantment of deck.enchantments ?? []) {
		if (enchantment.entityId != null && !enchantmentsByEntityId.has(enchantment.entityId)) {
			enchantmentsByEntityId.set(enchantment.entityId, enchantment);
		}
	}
	return { byAbsEntityId, handByEntityId, enchantmentsByEntityId };
};

export class DataScriptChangedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, , localPlayer] = gameEvent.parse();

		const updates = gameEvent.additionalData.updates;
		const playerDeck = currentState.playerDeck;
		const opponentDeck = currentState.opponentDeck;

		// Built lazily: many merged events only touch one side. The `hand` arrays are replaced
		// in place below, but the deck objects themselves keep their identity, so the indexes
		// stay valid as long as we update them when a hand card is replaced.
		let playerIndex: DeckDataScriptIndex | null = null;
		let opponentIndex: DeckDataScriptIndex | null = null;

		for (const update of updates) {
			const controllerId = update.ControllerId;
			const entityId = update.EntityId;

			const isPlayer = controllerId === localPlayer.PlayerId;
			const deck = isPlayer ? playerDeck : opponentDeck;
			const index = isPlayer
				? (playerIndex = playerIndex ?? buildDeckIndex(playerDeck))
				: (opponentIndex = opponentIndex ?? buildDeckIndex(opponentDeck));
			// console.debug('considering update', cardId, update, gameEvent);
			updateDataScriptInfoUnsafe(index, entityId, update.DataNum1, update.DataNum2);

			const cardInHand = entityId != null ? index.handByEntityId.get(entityId) : undefined;
			let newAbyssalCurseHighestValue = deck.abyssalCurseHighestValue;
			let newHand = deck.hand;
			if (cardInHand) {
				const cardWithAdditionalAttributes = addAdditionalAttribuesInHand(
					cardInHand,
					deck,
					update.DataNum1,
					update.DataNum2,
					update,
					this.allCards,
				);
				newHand = this.helper.replaceCardInZone(deck.hand, cardWithAdditionalAttributes);
				// Keep the index in sync with the replaced card so later updates in the same
				// merged event see the fresh object (mirrors re-running `.find` on the new hand).
				index.handByEntityId.set(entityId, cardWithAdditionalAttributes);
				const absKey = Math.abs(entityId);
				const existing = index.byAbsEntityId.get(absKey);
				if (existing?.card === cardInHand) {
					index.byAbsEntityId.set(absKey, { zone: 'hand', card: cardWithAdditionalAttributes });
				}

				newAbyssalCurseHighestValue =
					cardWithAdditionalAttributes.cardId === CardIds.SirakessCultist_AbyssalCurseToken
						? Math.max(
								deck.abyssalCurseHighestValue ?? 0,
								// When you are the active player, it's possible that the info comes from the FULL_ENTITY node itself,
								// while it is in the ENTITY_UPDATE event for the opponent
								!!update.DataNum1 && update.DataNum1 !== -1
									? update.DataNum1
									: cardWithAdditionalAttributes.mainAttributeChange! + 1,
							)
						: deck.abyssalCurseHighestValue;
			}
			// Modify in place
			if (isPlayer) {
				(playerDeck as Mutable<DeckState>).hand = newHand;
				(playerDeck as Mutable<DeckState>).abyssalCurseHighestValue = newAbyssalCurseHighestValue;
			}
			if (!isPlayer) {
				(opponentDeck as Mutable<DeckState>).hand = newHand;
				(opponentDeck as Mutable<DeckState>).abyssalCurseHighestValue = newAbyssalCurseHighestValue;
			}
		}

		return currentState.update({
			playerDeck: playerDeck.update({
				hand: playerDeck.hand,
			}),
			opponentDeck: opponentDeck.update({
				hand: opponentDeck.hand,
			}),
		});
	}

	event(): string {
		return GameEvent.DATA_SCRIPT_CHANGED;
	}
}

const updateDataScriptInfoUnsafe = (
	index: DeckDataScriptIndex,
	entityId: number,
	dataNum1: number,
	dataNum2: number,
): void => {
	const found = entityId != null ? index.byAbsEntityId.get(Math.abs(entityId)) : undefined;
	if (!found?.card) {
		const enchant = entityId != null ? index.enchantmentsByEntityId.get(entityId) : undefined;
		if (enchant) {
			if (!enchant.tags) {
				enchant.tags = {};
			}
			const tags = enchant.tags;
			tags[GameTag.TAG_SCRIPT_DATA_NUM_1] = dataNum1;
			tags[GameTag.TAG_SCRIPT_DATA_NUM_2] = dataNum2;
		}
		return;
	}

	found.card.tags[GameTag.TAG_SCRIPT_DATA_NUM_1] = dataNum1;
	found.card.tags[GameTag.TAG_SCRIPT_DATA_NUM_2] = dataNum2;
};
