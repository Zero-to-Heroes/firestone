/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * **Blooming Bulb** (token of Cultivating Sprite): Spell — Cast three random _N_-Cost spells. _Upgrades each turn!_
 * The tier _N_ is stored on the entity as {@link GameTag.TAG_SCRIPT_DATA_NUM_1} and drives the random spell pool
 * (`dynamicPool` / `guessInfo`).
 *
 * Turn upgrades are applied in the client via SUB_SPELL only (often no `TAG_CHANGE` for script data); we bump
 * {@link GameTag.TAG_SCRIPT_DATA_NUM_1} on matching {@link GameEvent.SUB_SPELL_END} through `CustomEffectCard`.
 */
import { CardIds, CardType, GameTag, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { GameState } from '../../models/game-state';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import {
	CustomEffectCard,
	GeneratingCard,
	GuessInfoInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';
import { filterCards } from './utils';

/**
 * Prefab id for ranked-spell upgrade VFX (the segment before `:` in `SpellPrefabGUID=` in power.log).
 * Must match {@link CustomEffects2Parser} / SUB_SPELL payload `prefabId`.
 */
export const BLOOMING_BULB_RANKED_UPGRADE_SUB_SPELL_PREFAB = 'BARFX_RankedSpell_Upgrade_Impact_Nature_Druid';

export const BloomingBulb: GeneratingCard & StaticGeneratingCard & CustomEffectCard = {
	cardIds: [CardIds.CultivatingSprite_BloomingBulbToken_MEND_100t],
	publicCreator: true,
	effects: [BLOOMING_BULB_RANKED_UPGRADE_SUB_SPELL_PREFAB],
	customEffect: ({ currentState, gameEvent }): GameState => {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const targetIds = gameEvent.additionalData?.targetEntityIds as readonly number[] | undefined;
		if (!targetIds?.length) {
			return currentState;
		}
		const entityId = targetIds[0];
		const bulbId = CardIds.CultivatingSprite_BloomingBulbToken_MEND_100t;

		const loc = deck.findCard(entityId);
		if (!loc || loc.zone !== 'hand' || loc.card.cardId !== bulbId) {
			return currentState;
		}
		const card = loc.card;
		const currentTier = card.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1];
		const base = currentTier != null && currentTier >= 0 ? currentTier : 1;
		const updated = card.update({
			tags: {
				...card.tags,
				[GameTag.TAG_SCRIPT_DATA_NUM_1]: base + 1,
			},
		});
		const newHand = deck.hand.map((c) =>
			Math.abs(c.entityId ?? 0) === Math.abs(entityId) ? updated : c,
		);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deck.update({ hand: newHand }),
		});
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const deckCard = input.inputOptions.deckState.findCard(input.entityId)?.card;
		const v = deckCard?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1];
		const cost = v != null && v >= 0 ? v : 1;
		return filterCards(
			CardIds.CultivatingSprite_BloomingBulbToken_MEND_100t,
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && (c.cost ?? 0) === cost,
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const v = input.card.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1];
		const cost = v != null && v >= 0 ? v : 1;
		const possibleCards = filterCards(
			CardIds.CultivatingSprite_BloomingBulbToken_MEND_100t,
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && (c.cost ?? 0) === cost,
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
