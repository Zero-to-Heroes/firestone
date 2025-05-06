/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-case-declarations */
/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

const GOLD_DELTA_PLAYER_ENCHANTMENTS = [
	CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment,
	CardIds.Overconfidence_OverconfidentDntEnchantment_BG28_884e,
	CardIds.GraceFarsail_ExtraGoldIn2TurnsDntEnchantment_BG31_825e2,
];

export class GoldNextTurnCounterDefinitionV2 extends CounterDefinitionV2<{
	overconfidences: number;
	enchantments: readonly { cardId: string; creatorCardId?: string; gold: number }[];
}> {
	public override id: CounterType = 'bgsGoldDelta';
	public override image = CardIds.RecklessInvestment_BG28_513;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsGoldDeltaCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => this.buildValue(state),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-gold-delta-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-gold-delta-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
		countersUseExpandedView: boolean,
	): string {
		const input = this.player.value(gameState, bgState)!;
		const groupedByCard = groupByFunction(
			(e: { cardId: string; creatorCardId?: string; gold: number }) => e.creatorCardId ?? e.cardId,
		)(input.enchantments);
		const cardsStrArray = Object.keys(groupedByCard).map((cardId) => {
			const cardName = this.allCards.getCard(cardId)?.name;
			const goldForCard = getGoldForCard(cardId);
			const count =
				goldForCard > 0
					? groupedByCard[cardId].map((c) => c.gold).reduce((a, b) => a + b, 0) / goldForCard
					: groupedByCard[cardId].length;
			return this.i18n.translateString('counters.bgs-gold-delta.card', { cardName, count });
		});
		const cardsStr = countersUseExpandedView ? '<br/>' + cardsStrArray.join('<br/>') : cardsStrArray.join(', ');

		const goldDeltaSure: number = input.enchantments.reduce((a, b) => a + b.gold, 0);
		const goldDelta: number = goldDeltaSure + 3 * input.overconfidences;
		const maxValueText =
			goldDelta === goldDeltaSure
				? ''
				: ` (${this.i18n.translateString('counters.bgs-gold-delta.up-to', {
						maxValue: goldDelta,
				  })})`;
		const tooltip = this.i18n.translateString(`counters.bgs-gold-delta.${side}`, {
			value: goldDeltaSure,
			maxValueText: maxValueText,
			cards: cardsStr,
		});

		return tooltip;
	}

	protected override formatValue(
		value:
			| {
					overconfidences: number;
					enchantments: readonly { cardId: string; creatorCardId?: string; gold: number }[];
			  }
			| null
			| undefined,
	): null | undefined | number | string {
		if (!value) {
			return null;
		}
		const goldDeltaSure: number = value.enchantments.reduce((a, b) => a + b.gold, 0);
		const goldDelta: number = goldDeltaSure + 3 * value.overconfidences;
		const goldDeltaStr = goldDelta === goldDeltaSure ? `${goldDeltaSure}` : `${goldDeltaSure} (${goldDelta})`;
		return goldDeltaStr;
	}

	private buildValue(deckState: GameState): {
		overconfidences: number;
		enchantments: readonly { cardId: string; creatorCardId?: string; gold: number }[];
	} | null {
		const playerEnchants = deckState.playerDeck.enchantments.filter((e) =>
			GOLD_DELTA_PLAYER_ENCHANTMENTS.includes(e.cardId as CardIds),
		);
		const minionEnchants = deckState.fullGameState?.Player?.Board?.flatMap((m) => m.enchantments);
		const playerEnchantGold =
			playerEnchants
				.filter((e) => e.cardId !== CardIds.Overconfidence_BG28_884)
				.map((e) => ({
					cardId: e.cardId,
					creatorCardId: e.creatorCardId,
					gold: getGoldForPlayerEnchant(e),
				}))
				.filter((e) => e.gold !== 0) ?? [];
		const minionEnchantGold =
			minionEnchants
				?.map((e) => ({
					cardId: e.cardId,
					gold: getGoldForMinion(e, deckState.playerDeck, this.allCards),
				}))
				.filter((e) => e.gold !== 0) ?? [];
		const minionsBoardGold =
			deckState.playerDeck.board
				?.map((e) => ({
					cardId: e.cardId,
					creatorCardId: e.creatorCardId,
					gold: getGoldForMinion(e, deckState.playerDeck, this.allCards),
				}))
				.filter((e) => e.gold !== 0) ?? [];
		const enchants = [...playerEnchantGold, ...minionEnchantGold, ...minionsBoardGold];
		const overconfidences = playerEnchants.filter((e) => e.cardId === CardIds.Overconfidence_BG28_884).length;

		const totalMaybe = enchants.reduce((a, b) => a + b.gold, 0) + 3 * overconfidences;
		if (totalMaybe === 0) {
			return null;
		}

		const result = {
			overconfidences: playerEnchants.filter((e) => e.cardId === CardIds.Overconfidence_BG28_884).length,
			enchantments: enchants,
		};
		return result;
	}
}

const getGoldForPlayerEnchant = (enchantment: { cardId: string; tags?: { [Name in GameTag]?: number } }): number => {
	switch (enchantment.cardId) {
		case CardIds.SouthseaBusker_ExtraGoldNextTurnDntEnchantment:
			return enchantment.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0;
		case CardIds.GraceFarsail_ExtraGoldIn2TurnsDntEnchantment_BG31_825e2:
			return enchantment.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2] === 1
				? enchantment.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0
				: 0; // Not next turn
		default:
			return 0;
	}
};

const getGoldForMinion = (
	enchantment: { cardId: string },
	playerDeck: DeckState,
	allCards: CardsFacadeService,
): number => {
	switch (enchantment.cardId) {
		case CardIds.AccordOTron_BG26_147:
		case CardIds.AccordOTron_AccordOTronEnchantment_BG26_147e:
			return 1;
		case CardIds.AccordOTron_BG26_147_G:
		case CardIds.AccordOTron_AccordOTronEnchantment_BG26_147_Ge:
			return 2;
		case CardIds.RecordSmuggler_BG26_812:
		case CardIds.RecordSmuggler_BG26_812_G:
			const smugglerMultiplier = enchantment.cardId === CardIds.RecordSmuggler_BG26_812 ? 1 : 2;
			const extraGold =
				playerDeck.board.filter((e) => allCards.getCard(e.cardId).races?.includes(Race[Race.PIRATE])).length >=
				3
					? 2
					: 0;
			return smugglerMultiplier * (2 + extraGold);
		default:
			return 0;
	}
};

const getGoldForCard = (cardId: string): number => {
	switch (cardId) {
		case CardIds.CarefulInvestment_BG28_800:
			return 2;
		default:
			return 0;
	}
};
